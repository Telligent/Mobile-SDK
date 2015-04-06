using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Telligent.Evolution.Mobile.App.Services;
using Telligent.Evolution.Mobile.App.Model;
using Telligent.Evolution.Extensibility.Storage.Version1;
using System.IO;
using System.IO.Compression;
using System.Text.RegularExpressions;
using System.Collections.Specialized;

namespace Telligent.Evolution.Mobile.App.Implementations
{
	internal class AppDataService : IAppDataService
	{
		private readonly string[] ImageSearchPaths = new string[] {
			@"res/drawable-xxhdpi/icon.png",
			@"res/drawable-xhdpi/icon.png",
			@"res/drawable-hdpi/icon.png",
			@"res/drawable/icon.png",
			@"iTunesArtwork"
		};

		#region IAppDataService Members

		public AppData Get(ICentralizedFile sourceFile)
		{
			if (sourceFile == null)
				return null;

			string cacheKey = GetCacheKey(sourceFile);
			AppData appData = (AppData) Telligent.Evolution.Extensibility.Caching.Version1.CacheService.Get(cacheKey, Extensibility.Caching.Version1.CacheScope.Context | Extensibility.Caching.Version1.CacheScope.Process);
			if (appData == null)
			{
				var targetFileStore = CentralizedFileStorage.GetFileStore(CentralizedFileStorage.HasAccessValidator(sourceFile.FileStoreKey) ? AppConstants.SecureAppDataFileStoreKey : AppConstants.AppDataFileStoreKey);
				if (targetFileStore == null)
					return null;

				string appPath = CentralizedFileStorage.MakePath(sourceFile.FileStoreKey, sourceFile.Path, sourceFile.FileName.Replace(CentralizedFileStorage.DirectorySeparator.ToString(), ""));

				appData = GetOrExtractAppData(sourceFile, targetFileStore, appPath);

				Telligent.Evolution.Extensibility.Caching.Version1.CacheService.Put(cacheKey, appData, Extensibility.Caching.Version1.CacheScope.Context | Extensibility.Caching.Version1.CacheScope.Process, new string[] { GetTag() });
			}

			return appData;
		}

		public void ExpireCache()
		{
			Telligent.Evolution.Extensibility.Caching.Version1.CacheService.RemoveByTags(new string[] { GetTag() }, Extensibility.Caching.Version1.CacheScope.Context | Extensibility.Caching.Version1.CacheScope.Process);
		}

		#endregion

		private string GetCacheKey(ICentralizedFile sourceFile)
		{
			return string.Concat("AppData_PK:", sourceFile.FileStoreKey, ":", sourceFile.Path, ":", sourceFile.FileName);
		}

		private string GetTag()
		{
			return "AppData_TAG";
		}

		private AppData GetOrExtractAppData(ICentralizedFile sourceFile, ICentralizedFileStorageProvider targetFileStore, string targetPath)
		{
			var appDataFile = targetFileStore.GetFile(targetPath, "appdata");
			if (appDataFile != null)
			{
				using (Stream appDataStream = appDataFile.OpenReadStream())
				{
					byte[] data = new byte[appDataStream.Length];
					appDataStream.Read(data, 0, data.Length);
					var qs = System.Web.HttpUtility.ParseQueryString(Encoding.UTF8.GetString(data));

					return new AppData {
						Name = qs["name"] ?? sourceFile.FileName,
						ApplicationId = qs["appid"] ?? string.Empty,
						Image = string.IsNullOrEmpty(qs["image"]) ? null : targetFileStore.GetFile(targetPath, qs["image"]),
						IsDirectlyInstallable = string.IsNullOrEmpty(qs["installable"]) || qs["installable"] == "true",
						AppType = (AppType) Enum.Parse(typeof(AppType), qs["apptype"] ?? "Unknown", true),
						File = sourceFile
					};
				}
			}

			AppData appData = new AppData();
			appData.File = sourceFile;
			appData.AppType = AppType.Unknown;
			appData.IsDirectlyInstallable = false;

			using (var inStream = sourceFile.OpenReadStream())
			{
				using (var archive = new ZipArchive(inStream, ZipArchiveMode.Read, false))
				{
					var imageEntry = GetImageEntry(archive, ImageSearchPaths);
					if (imageEntry != null)
					{
						using (var imageStream = imageEntry.Open())
						{
							byte[] data = new byte[imageEntry.Length];
							imageStream.Read(data, 0, data.Length);
							using (var tempStream = new MemoryStream(data))
							{
								tempStream.Seek(0, SeekOrigin.Begin);
								appData.Image = targetFileStore.AddUpdateFile(targetPath, "icon.png", tempStream);
							}
						}
					}

					if (string.Compare(Path.GetExtension(sourceFile.FileName), ".apk", StringComparison.OrdinalIgnoreCase) == 0)
					{
						appData.AppType = AppType.Android;
						appData.IsDirectlyInstallable = true;
					}
					else if (string.Compare(Path.GetExtension(sourceFile.FileName), ".ipa", StringComparison.OrdinalIgnoreCase) == 0)
					{
						appData.AppType = AppType.iOS;
						appData.IsDirectlyInstallable = false;

						var iTunesEntry = archive.GetEntry(@"iTunesMetadata.plist");
						if (iTunesEntry != null)
						{
							using (var iTunesStream = iTunesEntry.Open())
							{
								byte[] data = new byte[iTunesEntry.Length];
								iTunesStream.Read(data, 0, data.Length);
								using (var tempStream = new MemoryStream(data))
								{
									tempStream.Seek(0, SeekOrigin.Begin);

									var iTunesData = (Dictionary<string, object>)PlistCS.Plist.readPlist(tempStream, PlistCS.plistType.Auto);
									object d;
									if (iTunesData.TryGetValue("softwareVersionBundleId", out d))
										appData.ApplicationId = d.ToString();

									if (iTunesData.TryGetValue("playlistName", out d))
										appData.Name = d.ToString();
								}
							}
						} else {
							// this is not packaged for iTunes, check the Payload for developer/enterprise-deployment details
							foreach (var entry in archive.Entries.Where(x => x.FullName.StartsWith(@"Payload/", StringComparison.OrdinalIgnoreCase) && x.FullName.EndsWith(@"/Info.plist", StringComparison.OrdinalIgnoreCase)))
							{
								var appFolder = entry.FullName.Substring(8, entry.FullName.Length - 19);
								if (!appFolder.Contains(@"/"))
								{
									using (var plistStream = entry.Open())
									{
										byte[] data = new byte[entry.Length];
										plistStream.Read(data, 0, data.Length);
										using (var tempStream = new MemoryStream(data))
										{
											tempStream.Seek(0, SeekOrigin.Begin);

											var plistData = (Dictionary<string, object>)PlistCS.Plist.readPlist(tempStream, PlistCS.plistType.Auto);
											object d;
											if (plistData.TryGetValue("CFBundleIdentifier", out d))
												appData.ApplicationId = d.ToString();

											if (plistData.TryGetValue("CFBundleName", out d))
												appData.Name = d.ToString();
										}
									}

									imageEntry = GetImageEntry(archive, new string[] {
										string.Concat(@"Payload/", appFolder, @"/icon-320.png"),
										string.Concat(@"Payload/", appFolder, @"/icon-76@2x.png"),
										string.Concat(@"Payload/", appFolder, @"/icon-72@2x.png"),
										string.Concat(@"Payload/", appFolder, @"/icon-60@2x.png"),
										string.Concat(@"Payload/", appFolder, @"/icon@2x.png"),
										string.Concat(@"Payload/", appFolder, @"/icon.png")
									});

									if (imageEntry != null)
									{
										using (var imageStream = imageEntry.Open())
										{
											byte[] data = new byte[imageEntry.Length];
											imageStream.Read(data, 0, data.Length);
											using (var tempStream = new MemoryStream(data))
											{
												tempStream.Seek(0, SeekOrigin.Begin);
												using (var uncrushedStream = new MemoryStream())
												{
													PNGDecrush.PNGDecrusher.Decrush(tempStream, uncrushedStream);
													uncrushedStream.Seek(0, SeekOrigin.Begin);
													appData.Image = targetFileStore.AddUpdateFile(targetPath, "icon.png", uncrushedStream);
												}
											}
										}
									}

									var provisionEntry = archive.GetEntry(string.Concat(@"Payload/", appFolder, @"/embedded.mobileprovision"));
									if (provisionEntry != null)
									{
										appData.IsDirectlyInstallable = true;
									}
								}
							}
						}
					}
				}
			}

			if (string.IsNullOrEmpty(appData.Name))
				appData.Name = sourceFile.FileName.Substring(0, sourceFile.FileName.LastIndexOf('.'));

			if (appData.ApplicationId == null)
				appData.ApplicationId = "";

			StringBuilder qstr = new StringBuilder();
			qstr.Append("name=");
			qstr.Append(Uri.EscapeDataString(appData.Name));
			qstr.Append("&appid=");
			qstr.Append(Uri.EscapeDataString(appData.ApplicationId));
			qstr.Append("&image=");
			qstr.Append(appData.Image == null ? "" : Uri.EscapeDataString(appData.Image.FileName));
			qstr.Append("&installable=");
			qstr.Append(appData.IsDirectlyInstallable ? "true" : "false");
			qstr.Append("&apptype=");
			qstr.Append(Uri.EscapeDataString(appData.AppType.ToString()));

			using (var appDataStream = new MemoryStream(Encoding.UTF8.GetBytes(qstr.ToString())))
			{
				appDataStream.Seek(0, SeekOrigin.Begin);
				targetFileStore.AddUpdateFile(targetPath, "appdata", appDataStream);
			}

			return appData;
		}

		private ZipArchiveEntry GetImageEntry(ZipArchive archive, string[] searchPaths)
		{
			ZipArchiveEntry image = null;

			// search known paths
			foreach (string path in searchPaths)
			{
				image = archive.GetEntry(path);
				if (image != null)
					return image;
			}

			return null;
		}
	}
}
