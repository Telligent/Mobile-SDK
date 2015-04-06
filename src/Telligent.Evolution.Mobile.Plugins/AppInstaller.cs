using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Telligent.Evolution.Extensibility.Version1;
using Telligent.Evolution.Extensibility.Content.Version1;
using Telligent.DynamicConfiguration.Components;
using Telligent.Evolution.Extensibility.Api.Version1;
using Telligent.Evolution.Extensibility.Api.Entities.Version1;
using Telligent.Evolution.Extensibility.Rest.Version2;
using Telligent.Evolution.Extensibility.UI.Version1;
using Telligent.Evolution.Extensibility.Storage.Version1;
using Telligent.Evolution.Extensibility.Urls.Version1;
using System.IO;
using System.Text.RegularExpressions;

namespace Telligent.Evolution.Mobile.App
{
	public class AppInstaller : IPlugin, INavigable, IConfigurablePlugin
	{
		IPluginConfiguration _configuration;
		Regex _androidHttpAuthUserAgentPattern = null;
		string _defaultAndroidHttpAuthUserAgentPattern = @"(?:Firefox|OPR/)";

		#region IPlugin Members

		public string Description
		{
			get { return "Enables installing iOS applications."; }
		}

		public void Initialize()
		{
		}

		public string Name
		{
			get { return "Mobile Application Installer"; }
		}

		#endregion

		#region IConfigurablePlugin Members

		public PropertyGroup[] ConfigurationOptions
		{
			get
			{
				PropertyGroup optionsGroup = new PropertyGroup("configuration", "Options", 0);

				optionsGroup.Properties.Add(new Property("androidHttpAuthEnabledUserAgentPattern", "Android User Agents Supporting HTTP-Based Authentication Pattern", PropertyType.String, 1, _defaultAndroidHttpAuthUserAgentPattern) { DescriptionText = "Some browsers and the default download manager on Android do not support HTTP-based authentication (used for Windows Authentication). This pattern identifies browsers on Android that should be able to download Android apps over Windows authentication." });

				return new PropertyGroup[] { optionsGroup };
			}
		}

		public void Update(IPluginConfiguration configuration)
		{
			_configuration = configuration;

			var pattern = _configuration.GetString("androidHttpAuthEnabledUserAgentPattern");
			if (!string.IsNullOrEmpty(pattern))
			{
				try
				{
					_androidHttpAuthUserAgentPattern = new Regex(pattern, RegexOptions.IgnoreCase);
				}
				catch
				{
					_androidHttpAuthUserAgentPattern = new Regex(_defaultAndroidHttpAuthUserAgentPattern, RegexOptions.IgnoreCase);
				}
			}
			else
				_androidHttpAuthUserAgentPattern = new Regex(_defaultAndroidHttpAuthUserAgentPattern, RegexOptions.IgnoreCase);
		}

		#endregion

		#region INavigable Members

		internal string FormatInstallationUrl(Telligent.Evolution.Mobile.App.Model.AppData appData)
		{
			if (appData.AppType == Model.AppType.Android)
				return FormatAndroidInstallationUrl(appData);
			else if (appData.AppType == Model.AppType.iOS)
				return FormatIosInstallationUrl(appData);
			else
				return null;
		}

		private string FormatAndroidInstallationUrl(Telligent.Evolution.Mobile.App.Model.AppData appData)
		{
			bool isAndroidDevice = false;
			try
			{
				var httpContext = System.Web.HttpContext.Current;
				if (appData.IsDirectlyInstallable && !string.IsNullOrEmpty(httpContext.Request.UserAgent) && httpContext.Request.UserAgent.Contains("Android"))
				{
					if (!(httpContext.User is System.Security.Principal.WindowsPrincipal) || _androidHttpAuthUserAgentPattern.IsMatch(httpContext.Request.UserAgent))
						return CentralizedFileStorage.GetGenericDownloadUrl(appData.File);
				}
			}
			catch
			{
			}

			return null;
		}

		private string FormatIosInstallationUrl(Model.AppData appData)
		{
			if (appData.IsDirectlyInstallable)
			{
				System.Web.HttpRequest request = null;
				try
				{
					request = System.Web.HttpContext.Current.Request;
				}
				catch
				{
				}

				// must be a secure connection and an iOS device to do a local installation
				if (request == null || !request.IsSecureConnection || string.IsNullOrEmpty(request.UserAgent) || !System.Text.RegularExpressions.Regex.IsMatch(request.UserAgent, @"(?:iPhone|iPad|iPod)", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
					return null;

				StringBuilder url = new StringBuilder();
				url.Append("itms-services://?action=download-manifest&url=");

				url.Append(PublicApi.Url.Absolute(PublicApi.Url.BuildUrl("ipa-installation")));
				url.Append("/__key/");
				url.Append(PublicApi.Url.EncodePathComponent(appData.File.FileStoreKey));
				if (!string.IsNullOrEmpty(appData.File.Path))
				{
					url.Append("/");
					url.Append(PublicApi.Url.EncodePathComponent(appData.File.Path));
				}
				url.Append("/");
				url.Append(PublicApi.Url.EncodeFileComponent(appData.File.FileName));
				url.Append("/install.plist");

				return url.ToString();
			}
			else
			{
				StringBuilder url = new StringBuilder();
				url.Append("http://appstore.com/");

				string appName = appData.Name;
				appName.Replace("&", "and");
				appName = appName.Normalize(NormalizationForm.FormKD);
				appName = appName.ToLowerInvariant();
				appName = System.Text.RegularExpressions.Regex.Replace(appName, "[^a-z0-9]", "");

				url.Append(appName);

				return url.ToString();
			}
		}

		public void RegisterUrls(IUrlController controller)
		{
			controller.AddRaw("ipa-installation", "install-ipa/{*pathInfo}", null, null, (c, p) =>
			{

				string path = c.Request.Url.LocalPath;

				path = path.Substring(path.IndexOf("__key/") + 6);

				if (path.EndsWith("/install.plist"))
					path = path.Substring(0, path.Length - 14);

				string fileStoreKey = path.Substring(0, path.IndexOf('/'));
				string fileName = path.Substring(path.LastIndexOf('/') + 1);

				if (path.Length - (fileStoreKey.Length + fileName.Length + 2) <= 0)
					path = string.Empty;
				else
					path = path.Substring(fileStoreKey.Length + 1, path.Length - (fileStoreKey.Length + fileName.Length + 2));

				fileStoreKey = PublicApi.Url.DecodePathComponent(fileStoreKey);
				fileName = PublicApi.Url.DecodeFileComponent(fileName);
				path = PublicApi.Url.DecodePathComponent(path);

				if (!CentralizedFileStorage.CurrentUserHasAccess(fileStoreKey, path, fileName))
				{
					c.Response.StatusCode = 404;
					return;
				}

				var fileStore = CentralizedFileStorage.GetFileStore(fileStoreKey);
				if (fileStore == null)
				{
					c.Response.StatusCode = 404;
					return;
				}

				var file = fileStore.GetFile(path, fileName);
				if (file == null)
				{
					c.Response.StatusCode = 404;
					return;
				}

				var appData = Telligent.Evolution.Mobile.ServiceLocator.Get<Telligent.Evolution.Mobile.App.Services.IAppDataService>().Get(file);
				if (appData == null)
				{
					c.Response.StatusCode = 404;
					return;
				}

				c.Response.ContentType = "application/xml";
				c.Response.Write(string.Format(@"<?xml version=""1.0"" encoding=""UTF-8""?>
<!DOCTYPE plist PUBLIC ""-//Apple//DTD PLIST 1.0//EN"" ""http://www.apple.com/DTDs/PropertyList-1.0.dtd"">
<plist version=""1.0"">
	<dict>
		<!-- array of downloads. -->
		<key>items</key>
		<array>
			<dict>
				<!-- an array of assets to download -->
				<key>assets</key>
				<array>
					<!-- software-package: the ipa to install. -->
					<dict>
						<!-- required.  the asset kind. -->
						<key>kind</key>
						<string>software-package</string>

						<!-- required.  the URL of the file to download. -->
						<key>url</key>
						<string>{0}</string>
					</dict>
				</array>

				<key>metadata</key>
				<dict>
					<!-- required -->
					<key>bundle-identifier</key>
					<string>{2}</string>

					<!-- required.  the download kind. -->
					<key>kind</key>
					<string>software</string>

					<!-- required.  the title to display during the download. -->
					<key>title</key>
					<string>{1}</string>
				</dict>
			</dict>
		</array>
	</dict>
</plist>", PublicApi.Html.Encode(PublicApi.Url.Absolute(file.GetDownloadUrl())), PublicApi.Html.Encode(appData.Name), PublicApi.Html.Encode(appData.ApplicationId)));
			}, new RawDefinitionOptions() { ForceLowercaseUrl = false, EnableRemoteProxying = true });
		}

		#endregion
	}
}
