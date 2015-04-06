using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Collections;
using Telligent.Evolution.Extensibility.Api.Entities.Version1;
using System.IO;
using System.IO.Compression;
using System.Drawing;
using System.Drawing.Imaging;

namespace Telligent.Evolution.MobilePackageBuilder.Plugins
{
	public class ContainersScriptedContentFragmentExtension : Telligent.Evolution.Extensibility.UI.Version1.IScriptedContentFragmentExtension
	{
		#region IScriptedContentFragmentExtension Members

		public string ExtensionName
		{
			get { return "telligent_v2_mobilePackage"; }
		}

		public object Extension
		{
			get { return new MobilePackageBuilderScriptedContentFragmentExtensionApi(); }
		}

		#endregion

		#region IPlugin Members

		public string Name
		{
			get { return "Mobile Package Scripted Content Fragment Extension (telligent_v2_mobilePackage)"; }
		}

		public string Description
		{
			get { return "Enables scripted content fragments to use create mobile build packages"; }
		}

		public void Initialize()
		{
		}

		#endregion
	}

	public class MobilePackageBuilderScriptedContentFragmentExtensionApi
	{
		public MobileBuildPackage Create(IDictionary options)
		{
			Dictionary<string, string> tokens = new Dictionary<string, string> {
				{ "id", "com.example.mobile" },
				{ "name", "Mobile" },
				{ "description", "Mobile application." },
				{ "url", "http:/example.com/" },
				{ "email", "admin@example.com" },
				{ "company", "Example" },
				{ "androidAppId", null },
				{ "statusTextIsDark", "true" },
				{ "mobileUrl", "http:/example.com/" },
				{ "mobileDomain", "example.com" },
				{ "urlscheme", "examplemobile" }
			};

			DateTime date = DateTime.UtcNow;
			tokens["version"] = string.Concat("1.0.", (date.Year - 2004).ToString("00"), (date.Month + 10).ToString("00"), (date.Day + 10).ToString("00"));

			string fileUploadContext = null,
				iconFileName = null,
				splashscreenFileName = null;

			MobileBuildPackage package = new MobileBuildPackage();

			try
			{
				try
				{
					if (options != null)
					{
						if (options["Id"] != null)
							tokens["id"] = options["Id"].ToString();

						if (options["Name"] != null)
							tokens["name"] = options["Name"].ToString();

						if (options["Description"] != null)
							tokens["description"] = options["Description"].ToString();

						if (options["Url"] != null)
							tokens["url"] = options["Url"].ToString();

						if (options["Email"] != null)
							tokens["email"] = options["Email"].ToString();

						if (options["Company"] != null)
							tokens["company"] = options["Company"].ToString();

						if (options["FileUploadContext"] != null)
							fileUploadContext = options["FileUploadContext"].ToString();

						if (options["IconFileName"] != null)
							iconFileName = options["IconFileName"].ToString();

						if (options["SplashscreenFileName"] != null)
							splashscreenFileName = options["SplashscreenFileName"].ToString();

						if (options["UrlScheme"] != null)
							tokens["urlscheme"] = options["UrlScheme"].ToString();

						if (options["MobileUrl"] != null)
						{
							Uri mobileUrl;
							if (Uri.TryCreate(options["MobileUrl"].ToString(), UriKind.Absolute, out mobileUrl))
							{
								tokens["mobileUrl"] = mobileUrl.OriginalString + (mobileUrl.OriginalString.EndsWith("/") ? "" : "/");
								tokens["mobileDomain"] = mobileUrl.Host;
							}
						}

						if (options["AndroidAppId"] != null)
							tokens["androidAppId"] = options["AndroidAppId"].ToString();

						if (options["StatusTextIsDark"] != null)
                            tokens["statusStyle"] = Convert.ToBoolean(options["StatusTextIsDark"]) ? "UIStatusBarStyleDefault" : "UIStatusBarStyleLightContent";
					}
				}
				catch (Exception ex)
				{
					throw new Exception("Could not parse package options", ex);
				}

				using (var outStream = new MemoryStream())
				{
					using (var archive = new ZipArchive(outStream, ZipArchiveMode.Create, true))
					{
						try
						{
							AddFile(archive, "config.xml", "Telligent.Evolution.MobilePackageBuilder.Package.www.config.xml", tokens, FileTypeEncoding.Html);
							AddFile(archive, "index.html", "Telligent.Evolution.MobilePackageBuilder.Package.www.index.html", tokens, FileTypeEncoding.Html);
							AddFile(archive, "css/ui.css", "Telligent.Evolution.MobilePackageBuilder.Package.www.css.ui.css", tokens, FileTypeEncoding.None);
							AddFile(archive, "js/jquery-1.9.1.min.js", "Telligent.Evolution.MobilePackageBuilder.Package.www.js.jquery-1.9.1.min.js", tokens, FileTypeEncoding.Javascript);
							AddFile(archive, "js/mobileconfig.js", "Telligent.Evolution.MobilePackageBuilder.Package.www.js.mobileconfig.js", tokens, FileTypeEncoding.Javascript);
							AddFile(archive, "js/native.js", "Telligent.Evolution.MobilePackageBuilder.Package.www.js.native.js", tokens, FileTypeEncoding.Javascript);
						}
						catch (Exception ex)
						{
							throw new Exception("Could not add configuration files to package", ex);
						}

						AddFile(archive, "res/.pgbomit", "", tokens, FileTypeEncoding.None);

						try
						{
							using (var iconStream = string.IsNullOrEmpty(fileUploadContext) || string.IsNullOrEmpty(iconFileName) ? GetEmbeddedFile("Telligent.Evolution.MobilePackageBuilder.Package.default.png") : GetUploadedFile(fileUploadContext, iconFileName))
							{
								using (var iconBitmap = new Bitmap(iconStream))
								{
									AddFile(archive, "icon.png", iconBitmap, 57, 57);

									AddFile(archive, "res/icon/android/hdpi.png", iconBitmap, 72, 72);
									AddFile(archive, "res/icon/android/ldpi.png", iconBitmap, 36, 36);
									AddFile(archive, "res/icon/android/mdpi.png", iconBitmap, 48, 48);
									AddFile(archive, "res/icon/android/xhdpi.png", iconBitmap, 96, 96);
									AddFile(archive, "res/icon/android/xxhdpi.png", iconBitmap, 144, 144);

									AddFile(archive, "res/icon/ios/icon-small.png", iconBitmap, 29, 29);
									AddFile(archive, "res/icon/ios/icon-40.png", iconBitmap, 40, 40);
									AddFile(archive, "res/icon/ios/icon-50.png", iconBitmap, 50, 50);
									AddFile(archive, "res/icon/ios/icon.png", iconBitmap, 57, 57);
									AddFile(archive, "res/icon/ios/icon-small-2x.png", iconBitmap, 58, 58);
									AddFile(archive, "res/icon/ios/icon-60.png", iconBitmap, 60, 60);
									AddFile(archive, "res/icon/ios/icon-72.png", iconBitmap, 72, 72);
									AddFile(archive, "res/icon/ios/icon-76.png", iconBitmap, 76, 76);
									AddFile(archive, "res/icon/ios/icon-40-2x.png", iconBitmap, 80, 80);
									AddFile(archive, "res/icon/ios/icon-50-2x.png", iconBitmap, 100, 100);
									AddFile(archive, "res/icon/ios/icon-2x.png", iconBitmap, 114, 114);
									AddFile(archive, "res/icon/ios/icon-60-2x.png", iconBitmap, 120, 120);
									AddFile(archive, "res/icon/ios/icon-72-2x.png", iconBitmap, 144, 144);
									AddFile(archive, "res/icon/ios/icon-76-2x.png", iconBitmap, 152, 152);
                                    AddFile(archive, "res/icon/ios/icon-60-3x.png", iconBitmap, 180, 180);
									AddFile(archive, "res/icon/ios/icon-320.png", iconBitmap, 320, 320);
								}
							}
						}
						catch (Exception ex)
						{
							throw new Exception("Could not resize package icon", ex);
						}

						try
						{
							using (var splashStream = string.IsNullOrEmpty(fileUploadContext) || string.IsNullOrEmpty(splashscreenFileName) ? GetEmbeddedFile("Telligent.Evolution.MobilePackageBuilder.Package.default.png") : GetUploadedFile(fileUploadContext, splashscreenFileName))
							{
								using (var splashBitmap = new Bitmap(splashStream))
								{
									AddFile(archive, "splash.png", splashBitmap, 320, 480);

									AddFile(archive, "res/screen/android/hdpi.png", splashBitmap, 480, 800);
									AddFile(archive, "res/screen/android/ldpi.png", splashBitmap, 200, 320);
									AddFile(archive, "res/screen/android/mdpi.png", splashBitmap, 320, 480);
									AddFile(archive, "res/screen/android/xhdpi.png", splashBitmap, 720, 1280);
									
									AddFile(archive, "res/screen/ios/Default.png", splashBitmap, 320, 480);
									AddFile(archive, "res/screen/ios/Default-2x.png", splashBitmap, 640, 960);
									AddFile(archive, "res/screen/ios/Default-568h-2x.png", splashBitmap, 640, 1136);

                                    AddFile(archive, "res/screen/ios/Default-667h-2x.png", splashBitmap, 750, 1334);
                                    AddFile(archive, "res/screen/ios/Default-736h-2x.png", splashBitmap, 1242, 2208);
                                    AddFile(archive, "res/screen/ios/Default-736h-2x-Landscape.png", splashBitmap, 2208, 1242);


									AddFile(archive, "res/screen/ios/Default-Portrait.png", splashBitmap, 768, 1024);
									AddFile(archive, "res/screen/ios/Default-Landscape.png", splashBitmap, 1024, 768);
									AddFile(archive, "res/screen/ios/Default-Portrait-2x.png", splashBitmap, 1536, 2048);
									AddFile(archive, "res/screen/ios/Default-Landscape-2x.png", splashBitmap, 2048, 1536);
								}
							}
						}
						catch (Exception ex)
						{
							throw new Exception("Could not resize package splash screen", ex);
						}

					}
					
					try
					{
						var fileManager = new Telligent.Evolution.Components.MultipleUploadFileManager();

						if (string.IsNullOrEmpty(fileUploadContext))
							fileUploadContext = Guid.NewGuid().ToString("N");

						outStream.Seek(0, SeekOrigin.Begin);
						fileManager.AddFile("phonegapbuild.zip", outStream, fileUploadContext);

						var file = fileManager.GetCfsFile("phonegapbuild.zip", fileUploadContext);
						if (file != null)
							package.Url = file.GetDownloadUrl();
					}
					catch (Exception ex)
					{
						if (ex is System.Web.HttpException || ex is System.Threading.ThreadAbortException)
							throw;

						throw new Exception("Could not finalize package file", ex);
					}
				}
			}
			catch (Exception ex)
			{
				if (ex is System.Web.HttpException || ex is System.Threading.ThreadAbortException)
					throw;

				package.Errors.Add(new Error("Unknown", ex.Message));
			}

			return package;			
		}

		#region Helpers

		private void AddFile(ZipArchive archive, string zipPath, Bitmap sourceImage, int width, int height)
		{
			var entry = archive.CreateEntry(zipPath);
			using (Stream entryStream = entry.Open())
			{
				using (var resizedImage = ResizeImage(sourceImage, width, height))
				{
					byte[] buffer = new byte[8 * 1024];
					int read;
					while ((read = resizedImage.Read(buffer, 0, buffer.Length)) > 0)
					{
						entryStream.Write(buffer, 0, read);
					}
				}

				entryStream.Flush();
			}
		}

		private void AddFile(ZipArchive archive, string zipPath, string sourceResourceName, Dictionary<string, string> tokens, FileTypeEncoding encoding)
		{
			var entry = archive.CreateEntry(zipPath);
			using (Stream entryStream = entry.Open())
			{
				if (string.IsNullOrEmpty(sourceResourceName))
				{
					byte[] buffer = Encoding.UTF8.GetBytes(zipPath);
					entryStream.Write(buffer, 0, buffer.Length);
				}
				else
				{
					using (var source = GetEmbeddedFile(sourceResourceName))
					{
						Func<string, string> encode;
						if (encoding == FileTypeEncoding.Html)
							encode = x => System.Web.HttpUtility.HtmlEncode(x);
						else if (encoding == FileTypeEncoding.Javascript)
							encode = x => System.Web.HttpUtility.JavaScriptStringEncode(x);
						else
							encode = x => x;

						using (var modifiedSource = ReplaceTokens(source, tokens, encode))
						{
							byte[] buffer = new byte[8 * 1024];
							int read;
							while ((read = modifiedSource.Read(buffer, 0, buffer.Length)) > 0)
							{
								entryStream.Write(buffer, 0, read);
							}
						}
					}
				}

				entryStream.Flush();
			}
		}

		private Stream GetEmbeddedFile(string resourceName)
		{
			return AppDomain.CurrentDomain.GetAssemblies().First(x => x.GetName().Name == "Telligent.Evolution.MobilePackageBuilder").GetManifestResourceStream(resourceName);
		}

		private Stream GetUploadedFile(string uploadContext, string fileName)
		{
			foreach (var file in Telligent.Glow.WebControlUtils.GetFiles(uploadContext))
			{
				if (file.FileName == fileName)
					return file.InputStream;
			}

			return null;
		}

		private Stream ReplaceTokens(Stream stream, Dictionary<string, string> tokens, Func<string, string> encode)
		{
			stream.Seek(0, SeekOrigin.Begin);
			string content = "";

			using (var reader = new StreamReader(stream))
			{
				content = reader.ReadToEnd();
			}

			foreach (string key in tokens.Keys)
			{
				string value;
				if (!tokens.TryGetValue(key, out value))
					value = string.Empty;

				content = content.Replace("${" + key + "}", encode(value));
			}

			var outStream = new MemoryStream(Encoding.UTF8.GetBytes(content));
			outStream.Seek(0, SeekOrigin.Begin);

			return outStream;
		}

		private Stream ResizeImage(Bitmap source, int width, int height)
		{
			ImageCodecInfo codecInfo = null;
			foreach (ImageCodecInfo ci in ImageCodecInfo.GetImageEncoders())
			{
				if (ci.FormatID == ImageFormat.Png.Guid)
				{
					codecInfo = ci;
					break;
				}
			}

			EncoderParameters encoderParameters = new EncoderParameters(1);
			encoderParameters.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, 85L);

			CorrectOrientation(source);

			MemoryStream returnStream = new MemoryStream();
			int newWidth = source.Width;
			int newHeight = source.Height;
			ZoomAndCrop(ref newWidth, ref newHeight, width, height);

			if (width <= 0)
				width = newWidth;

			if (height <= 0)
				height = newHeight;

			using (Bitmap bitmapResize = new Bitmap(width, height))
			{
				using (Graphics g = Graphics.FromImage(bitmapResize))
				{
					g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
					g.Clear(Color.Transparent);
					g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
					g.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;

					int baseX = ((width - newWidth) / 2);
					int baseY = ((height - newHeight) / 2);
					g.DrawImage(source,
						new Point[]
                            {
                                new Point(baseX, baseY), new Point(baseX + newWidth, baseY),
                                new Point(baseX, baseY + newHeight)
                            });
				}

				bitmapResize.Save(returnStream, codecInfo, encoderParameters);
				returnStream.Seek(0, SeekOrigin.Begin);

				return returnStream;
			}
		}


		private static void ZoomAndCrop(ref int width, ref int height, int maxWidth, int maxHeight)
		{
			if (width <= 0 || height <= 0 || (maxWidth <= 0 && maxHeight <= 0))
				return;

			float scale = 0;
			if (maxWidth > 0)
				scale = Math.Max(scale, (float)maxWidth / (float)width);

			if (maxHeight > 0)
				scale = Math.Max(scale, (float)maxHeight / (float)height);

			width = (int)Math.Ceiling(width * scale);
			height = (int)Math.Ceiling(height * scale);
		}

		private static void CorrectOrientation(Bitmap bitmap)
		{
			var orientation = bitmap.PropertyItems.FirstOrDefault(item => item.Id == 0x0112);
			if (orientation != null)
			{
				switch (BitConverter.ToInt16(orientation.Value, 0))
				{
					case 2:
						bitmap.RotateFlip(RotateFlipType.RotateNoneFlipX);
						break;
					case 3:
						bitmap.RotateFlip(RotateFlipType.Rotate180FlipNone);
						break;
					case 4:
						bitmap.RotateFlip(RotateFlipType.RotateNoneFlipY);
						break;
					case 5:
						bitmap.RotateFlip(RotateFlipType.Rotate270FlipX);
						break;
					case 6:
						bitmap.RotateFlip(RotateFlipType.Rotate90FlipNone);
						break;
					case 7:
						bitmap.RotateFlip(RotateFlipType.Rotate90FlipX);
						break;
					case 8:
						bitmap.RotateFlip(RotateFlipType.Rotate270FlipNone);
						break;
				}
			}
		}

		private enum FileTypeEncoding
		{
			Html,
			Javascript,
			None
		}

		#endregion
	}

	public class MobileBuildPackage : Telligent.Evolution.Extensibility.Api.Entities.Version1.AdditionalInfo
	{
		public MobileBuildPackage()
			: base()
		{
		}

		public string Url
		{
			get;
			internal set; 
		}
	}
}
