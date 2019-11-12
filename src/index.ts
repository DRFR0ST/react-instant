import { Command, flags } from "@oclif/command";
import * as uuid from "uuid/v1";
import * as util from "util";
import * as tempDirectory from "temp-dir";
const exec = util.promisify(require("child_process").exec);

class ReactInstant extends Command {
  public static description = "describe the command here";

  public static flags = {
    port: flags.integer({char: "p"}),
    version: flags.version({ char: "v" })
  };

  public static args = [{ name: "gir_url" }];

  public async cloneRepo(url: string) {
    const tmpDir = `${tempDirectory}/react-instant-${uuid()}`;

    this.log(`Cloning ${url} into ${tmpDir}`);
    await exec(`git clone ${url} ${tmpDir}`);
    return tmpDir;
  }

  public async installDeps(tmpDir: string) {
    this.log("Installing dependencies...");
    await exec(`cd ${tmpDir} && yarn`);
  }

  public async buildRepo(tmpDir: string) {
    this.log("Building project...");
    await exec(`cd ${tmpDir} && yarn build`);
  }

  public async serveRepo(tmpDir: string, port: number) {
    this.log("Serving project on port " + port);
    await exec(`cd ${tmpDir} && serve -s build -l ${port}`);
  }

  public async run() {
    const { args, flags } = this.parse(ReactInstant);

    if (!args.gir_url) { throw new Error("No git url provided"); }
    this.log("react-instant v1.0.0\n");

    const tmpDir = await this.cloneRepo(args.gir_url);
    await this.installDeps(tmpDir);
    await this.buildRepo(tmpDir);
    await this.serveRepo(tmpDir, flags.port || 5000);
  }
}

export = ReactInstant;
