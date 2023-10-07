import * as vscode from "vscode";
import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";

const configSectionName = "x16-kickass-ex"; // package.json/name
const displayName = "x16-KickAssEx"; // package.json/displayName;
const outputChannel = vscode.window.createOutputChannel(displayName);

export function activate(context: vscode.ExtensionContext)
{
	{
		let command = vscode.commands.registerCommand(`${configSectionName}.build`, buildPrg);
		context.subscriptions.push(command);
	}
	{
		let command = vscode.commands.registerCommand(`${configSectionName}.build_n_run`, buildAndRunPrg); 
		context.subscriptions.push(command);
	}
}

export function deactivate()
{
}

async function buildAndRunPrg()
{
	runPrg(await buildPrg());
}

/**  	
This function will build a .prg file from the assembler source with Kick Assembler and return the path & name of the generated .prg file
*/
async function buildPrg() : Promise<string>
{
	const editor = vscode.window.activeTextEditor;
	if (editor)
	{
		try
		{
			await editor.document.save();
			vscode.window.showInformationMessage('File saved');
		}
		catch(error)
		{
			vscode.window.showErrorMessage(`Error occured when saving the file: ${error}`);
			return "";
		}

		const outDir = "bin";
		const fileToCompile = editor.document.fileName;
		const prgFilename = path.basename(fileToCompile).replace(path.extname(fileToCompile), ".prg");
		const workDir = path.dirname(fileToCompile);
		const outputDir = path.join(workDir, outDir);
		const prgFilepath = path.join(outputDir, prgFilename);
		const confSection = vscode.workspace.getConfiguration(configSectionName);
		
		// Get settings from user configuration and check if they are correctly defined
		outputChannel.clear;
		outputChannel.show(false);

		const java : string = confSection.get("java") ?? "";
		if (java === "")
		{
			vscode.window.showErrorMessage("JavaVM not defined!");
			outputChannel.appendLine(`JavaVM not defined! Set ${configSectionName}.java in Extension Settings.`);
			return "";
		}
		
		const kickAssJar : string = confSection.get("kickAssJar") ?? "";
		if (kickAssJar === "")
		{
			vscode.window.showErrorMessage("Kick Assembler JAR path not defined!");
			outputChannel.appendLine(`Kick Assembler JAR path not defined! Set ${configSectionName}.kickAssJar in Extension Settings.`);
			return "";
		}
		if (!fs.existsSync(kickAssJar))
		{
			vscode.window.showErrorMessage("Kick Assembler JAR file not found.");
			outputChannel.appendLine(`Incorrect KickAssembler Jar:"${kickAssJar}"! Check ${configSectionName}.kickAssJar in Extension Settings.`);
			return "";
		}

		// Check if File to Compile is a file with one of the assembler extensions
		const assemblerExtensions = [".asm", ".a", ".s", ".lib", ".inc"]; 	// packages.json / contributes / languages / extensions
																			// also in kickassembler.tmLanguage fileTypes array
		if (assemblerExtensions.includes(path.extname(fileToCompile)))
		{
			outputChannel.appendLine(`Compiling "${fileToCompile}"`);
		}
		else
		{ // if not, stop the build
			outputChannel.appendLine("The file to compile does not appear to be an assembler file. Build process exited!");
			return "";
		}

		// Create Bin Directory in working directory if it does not exist yet
		if (!fs.existsSync(outputDir))
		{
			fs.mkdirSync(outputDir);
		}
		// delete files in the bin directory
		fs.readdirSync(outputDir).map((file) => fs.unlinkSync(path.join(outputDir, file)));

		//  Kick Assembler with arguments
		const args = ["-jar", kickAssJar, "-maxAddr", "131072", "-odir", outputDir, fileToCompile];

		{
			const debug = confSection.get("debug");
			if (debug)
			{
				args.push("-debug");
			}
		}

		{
			const bytedump = confSection.get("bytedump");
			if (bytedump)
			{
				args.push("-bytedump");
				const lstFilename = path.basename(fileToCompile).replace(path.extname(fileToCompile), ".lst");
				args.push("-bytedumpfile");
				args.push(lstFilename);
			}
		}

		{
			const showmem = confSection.get("showmem");
			if (showmem)
			{
				args.push("-showmem");
			}
		}

		{
			const symbols = confSection.get("symbols");
			if (symbols)
			{
				args.push("-symbolfile");
				args.push("-symbolfiledir");
				args.push(outputDir);
			}
		}

		//display the executed command in the output window
		outputChannel.appendLine(`${java} ${args.join(" ")}`);

		// Execute Kick Assembler. The process is launched in syncrone mode as the .prg file has to be build before launching the emulator
		let runjava = cp.spawnSync(java, args);
		outputChannel.appendLine(runjava.stdout.toString());
		outputChannel.appendLine("> Source file " + path.basename(fileToCompile) + " has been compiled to " + path.basename(prgFilepath));

		// The Build() funtion returns the build .prg file
		return prgFilepath;
	}
	else
	{
		return "";
	}
}

function runPrg(prgFile: string) : undefined
{
	const confSection = vscode.workspace.getConfiguration(configSectionName);
	outputChannel.appendLine("X16 emulator starting :");

	if (!prgFile)
	{
		outputChannel.appendLine("No .prg file. Emulator start aborded.");
		return;
	}

	// Get settings from user configuration and check if they are defined
	const x16emulator : string = confSection.get('x16emulator') ?? "";
	if (x16emulator === "")
	{
		vscode.window.showErrorMessage('Commander X16 emulator error.');
		outputChannel.appendLine(`Commander X16 emulator not defined! Check ${configSectionName}.x16emulator in Extension Settings.`);
		return;
	}
	if (!fs.existsSync(x16emulator))
	{
		vscode.window.showErrorMessage("Commander X16 emulator error.");
		outputChannel.appendLine(`Commander X16 emulator not correctly defined:${x16emulator}! Check ${configSectionName}.x16emulator in Extension Settings.`);
		return;
	}
	
	const x16emuScale : string = confSection.get("x16emulatorScale") ?? "";
	
	// If optional arguments are defined, add them to the arguments list
	let args : string[] = ["-scale", x16emuScale, "-prg", path.basename(prgFile)];
	
	const x16emuKeymap : string = confSection.get("x16emulatorKeymap") ?? "";
	if (x16emuKeymap)
	{
		args.push("-keymap");
		args.push(x16emuKeymap);
	}
	
	const x16emuDebug = confSection.get("x16emulatorDebug");
	if (x16emuDebug)
	{
		args.push("-debug");
	}
	
	const x16emuRunPrg = confSection.get("x16emulatorRunPrg");
	if (x16emuRunPrg)
	{
		args.push("-run");
	}
	
	const x16emuSDCard : string = confSection.get("x16emulatorSDCard") ?? "";
	if (x16emuSDCard) {
		if (fs.existsSync(x16emuSDCard)) {
			//file exists
			args.push("-sdcard");
			args.push(x16emuSDCard);
		} else {
			vscode.window.showErrorMessage("Commander X16 emulator error.");
			outputChannel.appendLine(`Commander X16 sdcard path not correctly defined: "${ x16emuSDCard }"! Check ${configSectionName}.x16emulatorSDCard in Extension Settings.`);
			return;
		}
	}

	const x16emuWarp = confSection.get("x16emulatorWarp");
	if (x16emuWarp)
	{
		args.push("-warp");
	}
	
	// Display the command that will be executed 
	
	outputChannel.append(x16emulator + " " + args.join(" "));
	
	// start the emulator
	//let runX16emulator = cp.spawn(x16emulator, args, { cwd: prgFile.dirname, detached: true, stdio: "inherit", shell: true });
	const runX16emulator = cp.spawn(x16emulator, args, { cwd: path.dirname(prgFile), detached: true });

	runX16emulator.stdout.on("data", (data) => outputChannel.appendLine(`\nx16emulator output: \n${ data }`) );

	runX16emulator.stderr.on("data", (data) => outputChannel.appendLine(`\nx16emulator error output: \n${ data }`) );

	runX16emulator.on("error", (error) => outputChannel.appendLine(`\nx16emulator error: \n${ error }`) );

	runX16emulator.stderr.on("close", () => outputChannel.appendLine("\nx16emulator halted.\n") );

	return;
}