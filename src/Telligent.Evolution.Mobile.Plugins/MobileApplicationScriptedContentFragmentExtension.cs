using System;
using System.Collections.Generic;
using System.Linq;
using Telligent.Evolution.Extensibility.UI.Version1;
using Telligent.Evolution.Extensibility.Version1;
using Telligent.Evolution.Mobile.App.Services;

namespace Telligent.Evolution.Mobile.App
{
	public class MobileApplicationScriptedContentFragmentExtension : IPlugin, IScriptedContentFragmentExtension, IPluginGroup
	{

		#region IPlugin Members

		public string Description
		{
			get { return "Enables widgets to extract information about mobile applications."; }
		}

		public void Initialize()
		{
		}

		public string Name
		{
			get { return "$mobile_v2_application Widget Extension"; }
		}

		#endregion

		#region IExtension Members

		public object Extension
		{
			get { return new MobileApplicationApi(); }
		}

		public string ExtensionName
		{
			get { return "mobile_v2_application"; }
		}

		#endregion

		#region IPluginGroup Members

		public IEnumerable<Type> Plugins
		{
			get 
			{
				return new Type[] {
					typeof(AppInstaller),
					typeof(MobileAppsFileStore),
					typeof(SecuredMobileAppsFileStore)
				};
			}
		}

		#endregion
	}

	public class MobileApplicationApi
	{
		private readonly IAppDataService _appDataService;

		internal MobileApplicationApi()
		{
			_appDataService = ServiceLocator.Get<IAppDataService>();
		}

		// TODO: Finish implementing Redirect Helper
		// public string RedirectTo(string url)
		// {
		// 	return "";
		// }

		[Documentation("Extracts details about an Android or iOS app.")]
		public MobileApplication Get(
			[Documentation("The URL of a locally-stored app")]
			string url
			)
		{
			if (string.IsNullOrEmpty(url))
				return new MobileApplication("No application URL was provided.");

			var file = Telligent.Evolution.Extensibility.Storage.Version1.CentralizedFileStorage.GetCentralizedFileByUrl(url);
			if (file == null)
				return new MobileApplication("Only locally stored applications can be accessed.");

			var extension = System.IO.Path.GetExtension(file.FileName).ToLowerInvariant();
			if (!(extension == ".ipa" || extension == ".apk"))
				return new MobileApplication("Unknown application type.");

			try
			{
				return new MobileApplication(_appDataService.Get(file), _appDataService);
			}
			catch (Exception ex)
			{
				return new MobileApplication("An error occurred while retrieving application details.");
			}
		}
	}

	public class MobileApplication : Telligent.Evolution.Extensibility.Api.Entities.Version1.AdditionalInfo
	{
		private Model.AppData _appData;
		private Services.IAppDataService _appDataService;

		internal MobileApplication(Model.AppData appData, Services.IAppDataService appDataService)
			: base()
		{
			_appData = appData;
			_appDataService = appDataService;
		}

		internal MobileApplication(string error)
			: base(new Extensibility.Api.Entities.Version1.Error("Unknown", error))
		{
		}

		[Documentation("The name of the app.")]
		public string Name
		{
			get 
			{
				if (_appData != null)
					return Telligent.Evolution.Extensibility.Api.Version1.PublicApi.Html.Encode(_appData.Name);

				return null;
			}
		}

		[Documentation(Description = "The type of the app.", Options = new string[] { "Android", "iOS", "Unknown" })]
		public string Type
		{
			get
			{
				if (_appData != null)
					return _appData.AppType.ToString();

				return Model.AppType.Unknown.ToString();
			}
		}

		[Telligent.Evolution.Extensibility.Remoting.Version1.Url]
		public string IconUrl
		{
			get 
			{
				if (_appData != null && _appData.Image != null)
					return Telligent.Evolution.Extensibility.Storage.Version1.CentralizedFileStorage.GetGenericDownloadUrl(_appData.Image);

				return null;
			}
		}

		[Documentation("The URL from which this app can be installed, either locally or through an app store (depending on the definition of the app). Null will be returned if the app cannot be installed on the accessing device or if the app does not support local installation.")]
		[Telligent.Evolution.Extensibility.Remoting.Version1.Url]
		public string InstallationUrl
		{
			get 
			{
				if (_appData != null)
				{
					var installer = PluginManager.Get<AppInstaller>().FirstOrDefault();
					if (installer != null)
						return installer.FormatInstallationUrl(_appData);
				}

				return null;
			}
		}
	}
}
