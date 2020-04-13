import * as core from "@actions/core";
import { context, GitHub } from "@actions/github";
import { diff } from "semver";

async function run(): Promise<void> {
    try {
        // Create GitHub client with the API token.
        const client = new GitHub(core.getInput("token", { required: true }));
        const packageVersionFileName = core.getInput("package_version_filename", { required: true });
        // Debug log the payload.
        core.debug(`Payload keys: ${Object.keys(context.payload)}`);

        // Get event name.
        const eventName = context.eventName;

        // Define the base and head commits to be extracted from the payload.
        let base: string | undefined;
        let head: string | undefined;

        switch (eventName) {
            case "pull_request":
                base = context.payload.pull_request?.base?.sha;
                head = context.payload.pull_request?.head?.sha;
                break;
            case "push":
                base = context.payload.before;
                head = context.payload.after;
                break;
            default:
                core.setFailed(
                    `This action only supports pull requests and pushes, ${context.eventName} events are not supported. ` +
                        "Please submit an issue on this action's GitHub repo if you believe this in correct."
                );
        }

        // Log the base and head commits
        core.info(`Base commit: ${base}`);
        core.info(`Head commit: ${head}`);

        // Ensure that the base and head properties are set on the payload.
        if (!base || !head) {
            core.setFailed(
                `The base and head commits are missing from the payload for this ${context.eventName} event. ` +
                    "Please submit an issue on this action's GitHub repo."
            );

            // To satisfy TypeScript, even though this is unreachable.
            base = "";
            head = "";
        }

        // Use GitHub's compare two commits API.
        // https://developer.github.com/v3/repos/commits/#compare-two-commits
        const response = await client.repos.compareCommits({
            base,
            head,
            owner: context.repo.owner,
            repo: context.repo.repo
        });

        // Ensure that the request was successful.
        if (response.status !== 200) {
            core.setFailed(
                `The GitHub API for comparing the base and head commits for this ${context.eventName} event returned ${response.status}, expected 200. ` +
                    "Please submit an issue on this action's GitHub repo."
            );
        }

        // Ensure that the head commit is ahead of the base commit.
        if (response.data.status !== "ahead") {
            core.setFailed(
                `The head commit for this ${context.eventName} event is not ahead of the base commit. ` +
                    "Please submit an issue on this action's GitHub repo."
            );
        }

        // Get the changed files from the response payload.
        const files = response.data.files;
        const targetFile = files.find(file => {
            return file.status === "modified" && file.filename === packageVersionFileName;
        });
        if (!targetFile) {
            core.info(`Not found ${packageVersionFileName} in this changes.\nThis commit does not version up.`);
            return;
        }
        const previousVersionContent = await client.repos.getContents({
            ref: base,
            path: packageVersionFileName,
            owner: context.repo.owner,
            repo: context.repo.repo,
            headers: {
                Accept: "application/vnd.github.v3.raw"
            }
        });
        const currentVersionContent = await client.repos.getContents({
            ref: head,
            path: packageVersionFileName,
            owner: context.repo.owner,
            repo: context.repo.repo,
            headers: {
                Accept: "application/vnd.github.v3.raw"
            }
        });
        if (typeof previousVersionContent.data !== "string") {
            core.setFailed(`The ${packageVersionFileName} content of base commit is something wrong.
It should be a single JSON file.

${JSON.stringify(previousVersionContent.data, null, 4)}  
`);
            return;
        }
        if (typeof currentVersionContent.data !== "string") {
            core.setFailed(`The ${packageVersionFileName} content of head commit is something wrong.
It should be a single JSON file.

${JSON.stringify(previousVersionContent.data, null, 4)}  
`);
            return;
        }

        const previousVersion: string | undefined = JSON.parse(previousVersionContent.data).version;
        const currentVersion: string | undefined = JSON.parse(currentVersionContent.data).version;
        if (previousVersion === undefined) {
            core.setFailed(`The ${packageVersionFileName} version of base commit is undefined.
It should be a JSON file like { version: "<version>" } 

${previousVersionContent.data}  
`);
            return;
        }
        if (currentVersion === undefined) {
            core.setFailed(`The ${packageVersionFileName} version of head commit is undefined.
It should be a JSON file like { version: "<version>" } 

${currentVersionContent.data}  
`);
            return;
        }

        // diff semver previous -> current
        const semverString = diff(previousVersion, currentVersion);
        if (semverString === null) {
            core.setFailed(`Can not get semver diff.
   
${previousVersion} -> ${currentVersion}   
`);
            return;
        }

        core.setOutput("semver", semverString);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
