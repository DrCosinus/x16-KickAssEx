"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const cp = __importStar(require("child_process"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const manifest = __importStar(require("./package.json"));
const config_section_name = manifest.name;
const display_name = manifest.displayName;
const conf_section = vscode.workspace.getConfiguration(config_section_name);
const outputChannel = vscode.window.createOutputChannel(display_name);
function activate(context) {
    for (const cmd of manifest.contributes.commands) {
        outputChannel.appendLine(`Add Command ${cmd.command}`);
        switch (cmd.title) {
            case "X16 Build":
                let commandBuild = vscode.commands.registerCommand(cmd.command, buildPrg);
                context.subscriptions.push(commandBuild);
                console.log(`${cmd.title}: OK`);
                break;
            case "X16 Build and Run":
                let commandRun = vscode.commands.registerCommand(cmd.command, () => runPrg(buildPrg()));
                context.subscriptions.push(commandRun);
                console.log(`${cmd.title}: OK`);
                break;
            default:
                console.log(`Command ${cmd.title}: Failure`);
        }
    }
    // console.log(`default :(`);
    // let commandBuild = vscode.commands.registerCommand(`${config_section_name}.build`, buildPrg);
    // let commandRun = vscode.commands.registerCommand(`${config_section_name}.run`, () => runPrg(buildPrg())); // Build then run 
    // context.subscriptions.push(commandBuild);
    // context.subscriptions.push(commandRun);
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
/**
This function will build a .prg file from the assembler source with Kick Assembler and return the path & name of the generated .prg file
*/
function buildPrg() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        if (editor.document.isDirty) {
            editor.document.save().then(() => {
                vscode.window.showInformationMessage('File saved');
            }, (error) => {
                vscode.window.showErrorMessage(`Error occured when saving the file: ${error}`);
            });
        }
        const outDir = "bin";
        const fileToCompile = editor.document.fileName;
        const prgFilename = path.basename(fileToCompile).replace(path.extname(fileToCompile), ".prg");
        const workDir = path.dirname(fileToCompile);
        const outputDir = path.join(workDir, outDir);
        const prgFilepath = path.join(outputDir, prgFilename);
        // Get settings from user configuration and check if they are correctly defined
        outputChannel.clear;
        outputChannel.show(false);
        const java = conf_section.get("java") ?? "";
        if (java == "") {
            vscode.window.showErrorMessage("JavaVM not defined!");
            outputChannel.appendLine(`JavaVM not defined! Set ${config_section_name}.java in Extension Settings.`);
            return "";
        }
        const kickAssJar = conf_section.get("kickAssJar") ?? "";
        if (kickAssJar == "") {
            vscode.window.showErrorMessage("Kick Assembler JAR path not defined!");
            outputChannel.appendLine(`Kick Assembler JAR path not defined! Set ${config_section_name}.kickAssJar in Extension Settings.`);
            return "";
        }
        if (!fs.existsSync(kickAssJar)) {
            vscode.window.showErrorMessage("Kick Assembler JAR file not found.");
            outputChannel.appendLine(`Incorrect KickAssembler Jar:"${kickAssJar}"! Check ${config_section_name}.kickAssJar in Extension Settings.`);
            return "";
        }
        // Check if File to Compile is a file with one of the assembler extensions
        const assemblerExtensions = manifest.contributes.languages[0].extensions; // [".asm", ".a", ".s", ".lib", ".inc"];
        if (assemblerExtensions.includes(path.extname(fileToCompile))) {
            outputChannel.appendLine(`Compiling "${fileToCompile}"`);
        }
        else { // if not, stop the build
            outputChannel.appendLine("The file to compile does not appear to be an assembler file. Build process exited!");
            return "";
        }
        // Create Bin Directory in working directory if it does not exist yet
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }
        // delete files in the bin directory
        fs.readdirSync(outputDir).map((file) => fs.unlinkSync(path.join(outputDir, file)));
        //  Kick Assembler with arguments
        const args = ["-jar", kickAssJar, "-debug", "-bytedump", "-symbolfile", "-symbolfiledir", outputDir, "-showmem", "-maxAddr", "131072", "-odir", outputDir, fileToCompile];
        //display the executed command in the output window
        outputChannel.append(`${java} ${args.join(" ")}`);
        // Execute Kick Assembler. The process is launched in syncrone mode as the .prg file has to be build before launching the emulator
        let runjava = cp.spawnSync(java, args);
        outputChannel.appendLine(runjava.stdout.toString());
        outputChannel.appendLine("> Source file " + path.basename(fileToCompile) + " has been compiled to " + path.basename(prgFilepath));
        // The Build() funtion returns the build .prg file
        return prgFilepath;
    }
    else
        return "";
}
function runPrg(prgFile) {
    outputChannel.appendLine("X16 emulator starting :");
    if (!prgFile) {
        outputChannel.appendLine("No .prg file. Emulator start aborded.");
        return;
    }
    // Get settings from user configuration and check if they are defined
    const x16emulator = conf_section.get('x16emulator') ?? "";
    if (x16emulator == "") {
        vscode.window.showErrorMessage('Commander X16 emulator error.');
        outputChannel.appendLine(`Commander X16 emulator not defined! Check ${config_section_name}.x16emulator in Extension Settings.`);
        return;
    }
    if (!fs.existsSync(x16emulator)) {
        vscode.window.showErrorMessage("Commander X16 emulator error.");
        outputChannel.appendLine(`Commander X16 emulator not correctly defined:${x16emulator}! Check ${config_section_name}.x16emulator in Extension Settings.`);
        return;
    }
    const x16emuScale = conf_section.get("x16emulatorScale") ?? "";
    // If optional arguments are defined, add them to the arguments list
    let args = ["-scale", x16emuScale, "-prg", path.basename(prgFile)];
    const x16emuKeymap = conf_section.get("x16emulatorKeymap") ?? "";
    if (x16emuKeymap) {
        args.push("-keymap");
        args.push(x16emuKeymap);
    }
    const x16emuDebug = conf_section.get("x16emulatorDebug");
    if (x16emuDebug) {
        args.push("-debug");
    }
    const x16emuRunPrg = conf_section.get("x16emulatorRunPrg");
    if (x16emuRunPrg) {
        args.push("-run");
    }
    const x16emuSDCard = conf_section.get("x16emulatorSDCard") ?? "";
    if (x16emuSDCard) {
        if (fs.existsSync(x16emuSDCard)) {
            //file exists
            args.push("-sdcard");
            args.push(x16emuSDCard);
        }
        else {
            vscode.window.showErrorMessage("Commander X16 emulator error.");
            outputChannel.appendLine(`Commander X16 sdcard path not correctly defined: "${x16emuSDCard}"! Check ${config_section_name}.x16emulatorSDCard in Extension Settings.`);
            return;
        }
    }
    const x16emuWarp = conf_section.get("x16emulatorWarp");
    if (x16emuWarp) {
        args.push("-warp");
    }
    // Display the command that will be executed 
    outputChannel.append(x16emulator + " " + args.join(" "));
    // start the emulator
    //let runX16emulator = cp.spawn(x16emulator, args, { cwd: prgFile.dirname, detached: true, stdio: "inherit", shell: true });
    const runX16emulator = cp.spawn(x16emulator, args, { cwd: path.dirname(prgFile), detached: true });
    runX16emulator.stdout.on("data", (data) => outputChannel.appendLine(`\nx16emulator output: \n${data}`));
    runX16emulator.stderr.on("data", (data) => outputChannel.appendLine(`\nx16emulator error output: \n${data}`));
    runX16emulator.on("error", (error) => outputChannel.appendLine(`\nx16emulator error: \n${error}`));
    runX16emulator.stderr.on("close", () => outputChannel.appendLine("\nx16emulator halted.\n"));
    return;
}
