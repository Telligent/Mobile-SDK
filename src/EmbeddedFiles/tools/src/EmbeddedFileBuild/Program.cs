using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NDesk.Options;
using System.IO;
using System.Reflection;
using System.Diagnostics;
using System.Timers;

namespace EmbeddedFileBuild
{
    class Program
    {
        static Timer _convertTimer = null;
        static bool _shouldConvert = false;
        static readonly object _convertLock = new object();

        static Dictionary<string, string> mimeTypes = new Dictionary<string, string>
        {
            { ".csv", "application/vnd.ms-excel" },
            { ".css", "text/css"  },
            { ".less", "text/css"  },
            { ".js", "text/javascript"  },
            { ".doc", "application/msword" },
            { ".gif", "image/gif"  },
            { ".bmp", "image/bmp" },
            { ".html", "text/html"  },
            { ".htm", "text/html"  },
            { ".jpg", "image/jpeg" },
            { ".jpeg", "image/jpeg" },
            { ".pdf", "application/pdf" },
            { ".png", "image/png" },
            { ".ppt", "application/vnd.ms-powerpoint" },
            { ".rtf", "application/msword" },
            { ".txt", "text/plain"  },
            { ".xls", "application/vnd.ms-excel" },
            { ".xml", "text/xml"  },
            { ".wmv", "video/x-ms-wmv" },
            { ".wma", "video/x-ms-wmv" },
            { ".mpeg", "video/mpeg" },
            { ".mpg", "video/mpeg" },
            { ".mpa", "video/mpeg" },
            { ".mpe", "video/mpeg" },
            { ".webm", "video/webm" },
            { ".ogv", "video/ogg" },
            { ".mov", "video/quicktime" },
            { ".qt", "video/quicktime" },
            { ".avi", "video/x-msvideo" },
            { ".asf", "video/x-ms-asf" },
            { ".asr", "video/x-ms-asf" },
            { ".asx", "video/x-ms-asf" },
            { ".swf", "application/x-shockwave-flash" },
            { ".flv", "video/x-flv" },
            { ".zip", "application/zip" },
            { ".mp3", "audio/mpeg" },
            { ".wav", "audio/wav" },
            { ".mp4", "video/mp4" },
            { ".ogg", "audio/ogg" },
            { ".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
            { ".dotx", "application/vnd.openxmlformats-officedocument.wordprocessingml.template" },
            { ".ppsx", "application/vnd.openxmlformats-officedocument.presentationml.slideshow" },
            { ".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
            { ".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
            { ".xltx", "application/vnd.openxmlformats-officedocument.spreadsheetml.template" },
            { ".otf", "font/opentype" },
            { ".eot", "application/vnd.ms-fontobject" },
            { ".svg", "image/svg" },
            { ".ttf", "font/truetype" },
            { ".woff", "application/x-font-woff" }
        };

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
                Console.WriteLine("mef: ");
                Console.WriteLine(ex.Message);
                Console.WriteLine("Try 'mef --help' for more information.");
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
                ConvertFiles(inputPath, outputPath);

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
                            ConvertFiles(inputPath, outputPath);
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
                ConvertFiles(inputPath, outputPath);
            }
        }

        static void ConvertFiles(string inputPath, string outputPath)
        {
            Console.WriteLine(String.Format("Reading: {0}", inputPath));
            Console.WriteLine(String.Format("Writing: {0}", outputPath));

            var encodedFiles = new StringBuilder();
            if (Utility.IsPathDirectory(inputPath))
            {
                encodedFiles.AppendLine("<resources>");
                encodedFiles.AppendLine("  <embeddedFiles>");
                foreach (var file in Directory.GetFiles(inputPath, "*.*", SearchOption.AllDirectories))
                {
                    if (Utility.IsPathDirectory(file))
                        continue;
                    string mimeType = "application/octet-stream";
                    mimeTypes.TryGetValue(Path.GetExtension(file), out mimeType);
                    encodedFiles.AppendLine(String.Format("    <embeddedFile name=\"{0}\" type=\"{1}\" base64=\"true\">", Path.GetFileName(file), mimeType));
                    encodedFiles.AppendLine(String.Format("      <![CDATA[{0}]]>", Splice(Convert.ToBase64String(File.ReadAllBytes(file)), 76)));
                    encodedFiles.AppendLine("    </embeddedFile>");
                }
                encodedFiles.AppendLine("  </embeddedFiles>");
                encodedFiles.AppendLine("</resources>");
            }

            File.WriteAllText(outputPath, encodedFiles.ToString());
        }

        public static string Splice(string text, int lineLength)
        {
            return System.Text.RegularExpressions.Regex.Replace(text, "(.{" + lineLength + "})", "$1" + Environment.NewLine);
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

            Console.WriteLine("mef " + version);
            Console.WriteLine();
            Console.WriteLine("Converts Files to Evolution Mobile embedded resources");
            Console.WriteLine();
            Console.WriteLine("Usage: mef [OPTIONS]");
            Console.WriteLine();
            Console.WriteLine("Options:");
            opts.WriteOptionDescriptions(Console.Out);
        }
    }
}
