using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using NDesk.Options;
using System.IO;
using System.Reflection;
using System.Diagnostics;
using System.Timers;

namespace MobileCssBuild
{
	class Program
	{
		static Timer _convertTimer = null;
		static bool _shouldConvert = false;
		static readonly object _convertLock = new object();

		static void Main(string[] args)
		{
			string inputPath = null;
			string outputPath = null;
			bool runAsWatcher = false;
			bool showHelp = false;

			var opts = new OptionSet()
			{
				{ "i|input=", "Input {PATH}", v => inputPath = v },
				{ "o|output=", "Output {PATH}", v => outputPath = v },
				{ "w|watch-files", "Monitor the input path for changes and re-convert", v => runAsWatcher = true },
				{ "h|help", "Show this message and exit", v => showHelp = false }
			};

			try
			{
				opts.Parse(args);
			}
			catch (OptionException ex)
			{
				Console.WriteLine("mcss: ");
				Console.WriteLine(ex.Message);
				Console.WriteLine("Try 'mcss --help' for more information.");
			}

			if (showHelp || String.IsNullOrWhiteSpace(inputPath) || String.IsNullOrWhiteSpace(outputPath))
			{
				ShowHelp(opts);
				return;
			}

			inputPath = Path.GetFullPath(inputPath);
			outputPath = Path.GetFullPath(outputPath);

			if (!Utility.PathExists(inputPath))
			{
				ShowHelp(opts);
				return;
			}

			if (inputPath == outputPath)
			{
				ShowHelp(opts);
				return;
			}

			if (runAsWatcher)
			{
				Convert(inputPath, outputPath);

				var watchPath = Utility.IsPathDirectory(inputPath) ? inputPath : Path.GetDirectoryName(inputPath);
				var watcher = new FileSystemWatcher(watchPath);
				watcher.IncludeSubdirectories = true;
				watcher.Changed += (sender, e) => ScheduleConvert();
				watcher.Created += (sender, e) => ScheduleConvert();
				watcher.Deleted += (sender, e) => ScheduleConvert();
				watcher.Renamed += (sender, e) => ScheduleConvert();
				watcher.EnableRaisingEvents = true;

				_convertTimer = new Timer(200);
				_convertTimer.Elapsed += (sender, e) =>
				{
					lock (_convertLock)
					{
						if (_shouldConvert)
						{
							_shouldConvert = false;
							Convert(inputPath, outputPath);
						}
					}
				};
				_convertTimer.Start();
				Console.WriteLine(String.Format("Watching {0} for changes...", inputPath));
				Console.ReadLine();
				_convertTimer.Stop();
			}
			else
			{
				Convert(inputPath, outputPath);
			}

			
		}

		static void Convert(string inputPath, string outputPath)		
		{
			Console.WriteLine(String.Format("Reading: {0}", inputPath));
			Console.WriteLine(String.Format("Writing: {0}", outputPath));
			var input = File.ReadLines(inputPath).ToList();
			var prefix = new string[] { "<resources>", "  <styleSheets>", "    <styleSheet>", "    <![CDATA[" };
			var postfix = new string[] { "    ]]>", "    </styleSheet>", "  </styleSheets>", "</resources>" };
			input.InsertRange(0, prefix);
			input.AddRange(postfix);
			File.WriteAllLines(outputPath, input.ToArray());
		}

		static void ScheduleConvert()
		{
			_shouldConvert = true;
		}

		static void ShowHelp(OptionSet opts)
		{
			Assembly assembly = Assembly.GetExecutingAssembly();
			FileVersionInfo fileVersionInfo = FileVersionInfo.GetVersionInfo(assembly.Location);
			string version = fileVersionInfo.ProductVersion;

			Console.WriteLine("mcss " + version);
			Console.WriteLine();
			Console.WriteLine("Converts CSS to Evolution Mobile resources");
			Console.WriteLine();
			Console.WriteLine("Usage: mcss [OPTIONS]");
			Console.WriteLine();
			Console.WriteLine("Options:");
			opts.WriteOptionDescriptions(Console.Out);
		}
	}
}
