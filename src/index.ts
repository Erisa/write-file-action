import { getInput, setFailed, setOutput } from "@actions/core";
import { mkdirP } from "@actions/io";
import { appendFile, exists, writeFile, stat } from "fs";
import { readFile } from "fs/promises"
import { dirname, join as joinPath, resolve as resolvePath } from "path";
import { promisify } from "util";

const appendFileAsync = promisify(appendFile);
const existsAsync = promisify(exists);
const writeFileAsync = promisify(writeFile);
const statAsync = promisify(stat);

main().catch((error) => setFailed(error.message));

async function main() {
  try {
    const path = getInput("path", { required: true });
    let contents = getInput("contents", { required: true });
    const mode = (getInput("write-mode") || "append").toLocaleLowerCase();

    // Ensure the correct mode is specified
    if (mode !== "append" && mode !== "append-newline" && mode !== "overwrite" && mode !== "preserve") {
      setFailed("Mode must be one of: overwrite, append, or preserve");
      return;
    }

    // Preserve the file
    if (mode === "preserve" && (await existsAsync(path))) {
      const statResult = await statAsync(path);
      setOutput("size", `${statResult.size}`);
      return;
    }

    const targetDir = dirname(path);

    await mkdirP(targetDir);

    if (mode === "overwrite") {
      await writeFileAsync(path, contents);
    } else if (mode == "append-newline"){
      const fileData = (await readFile(path)).toString();
      // only add a newline if one is necessary, don't introduce empty lines
      if (!endsInNewlines(fileData)){
        // this code assumes lf is wanted because it's what i (Erisa) needed
        console.log("thought it didnt end in newline")
        contents = "\n" + contents;
      }
      // if the input **doesn't** end with a newline, add one of those as well
      if (!endsInNewlines(contents)){
        console.log("thought input didnt end in newline")
        contents += "\n";
      }

      await appendFileAsync(path, contents);
    }
    else {
      await appendFileAsync(path, contents);
    }

    const statResult = await statAsync(path);
    setOutput("size", `${statResult.size}`);
  } catch (error) {
    setFailed((error as Error).message);
  }
}

function endsInNewlines(text: string){
  if (text.endsWith("\n") || text.endsWith("\r") || text.endsWith("\r\n")){
    return true;
  } else {
    return false;
  }
}