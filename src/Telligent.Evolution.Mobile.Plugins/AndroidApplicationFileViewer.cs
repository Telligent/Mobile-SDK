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

namespace Telligent.Evolution.Mobile.App
{
	public class AndroidApplicationFileViewer : IPlugin, IFileViewer, IPluginGroup, ITranslatablePlugin
	{
		ITranslatablePluginController _translation;

		#region IPlugin Members

		public string Description
		{
			get { return "Enables previewing and installation Android applications."; }
		}

		public void Initialize()
		{
		}

		public string Name
		{
			get { return "Android Application File Viewer"; }
		}

		#endregion

		#region ITranslatablePlugin Members

		public Translation[] DefaultTranslations
		{
			get
			{
				Translation translation = new Translation("en-US");
				translation.Set("ota_install", "Tap to install");

				return new Translation[] { translation };
			}
		}

		public void SetController(ITranslatablePluginController controller)
		{
			_translation = controller;
		}

		#endregion

		#region IFileViewer Members

		public int DefaultOrderNumber
		{
			get { return 100; }
		}

		public FileViewerMediaType GetMediaType(Uri url, IFileViewerOptions options)
		{
			throw new FileViewerNotSupportedException();
		}

		public FileViewerMediaType GetMediaType(ICentralizedFile file, IFileViewerOptions options)
		{
			return FileViewerMediaType.Image;
		}

		public string Render(Uri url, IFileViewerOptions options)
		{
			throw new FileViewerNotSupportedException();
		}

		public string Render(ICentralizedFile file, IFileViewerOptions options)
		{
			var appData = Telligent.Evolution.Mobile.ServiceLocator.Get<Telligent.Evolution.Mobile.App.Services.IAppDataService>().Get(file);
			if (appData == null || appData.Image == null)
				throw new FileViewerNotSupportedException();

			if (options.ViewType == FileViewerViewType.Preview)
				return Telligent.Evolution.Extensibility.Api.Version1.PublicApi.UI.GetResizedImageHtml(CentralizedFileStorage.GetGenericDownloadUrl(appData.Image), options.Width.HasValue ? options.Width.Value : 0, options.Height.HasValue ? options.Height.Value : 0, new UiGetResizedImageHtmlOptions { ResizeMethod = "ZoomAndCrop", OutputIsPersisted = options.OutputIsPersisted });
			else
			{
				StringBuilder html = new StringBuilder();
				string installUrl = null;

				var installer = PluginManager.Get<AppInstaller>().FirstOrDefault();
				if (installer != null)
					installUrl = installer.FormatInstallationUrl(appData);

				if (!string.IsNullOrEmpty(installUrl))
				{
					html.Append("<a href=\"");
					html.Append(PublicApi.Html.Encode(installUrl));
					html.Append("\" style=\"display:inline-block; background-color: #f3f3f3; color: #555; text-align: center; text-decoration: none; padding: 2px; border-radius: 10px;\" class=\"app-viewer with-install\">");
				}
				else
				{
					html.Append("<span class=\"app-view without-install\">");
				}

				html.Append(Telligent.Evolution.Extensibility.Api.Version1.PublicApi.UI.GetResizedImageHtml(CentralizedFileStorage.GetGenericDownloadUrl(appData.Image), options.Width.HasValue ? options.Width.Value : 0, options.Height.HasValue ? options.Height.Value : 0, new UiGetResizedImageHtmlOptions
				{
					ResizeMethod = "ScaleDown",
					OutputIsPersisted = options.OutputIsPersisted,
					HtmlAttributes = new Dictionary<string, string>
					{
						{ "style", "border-radius: 10px; display: inline-block;" }
					}
				}));

				if (!string.IsNullOrEmpty(installUrl))
				{
					html.Append("<div style=\"padding: 8px;\">");
					html.Append(_translation.GetLanguageResourceValue("ota_install"));
					html.Append("</div></a>");
				}
				else
				{
					html.Append("</span>");
				}

				return html.ToString();
			}
		}

		public string[] SupportedFileExtensions
		{
			get { return new string[] { "apk" }; }
		}

		public string SupportedUrlPattern
		{
			get { return null; }
		}
		
		#endregion

		#region IPluginGroup Members

		public IEnumerable<Type> Plugins
		{
			get 
			{
				return new Type[] { 
					typeof(MobileAppsFileStore),
					typeof(SecuredMobileAppsFileStore),
					typeof(AppInstaller)
				};
			}
		}

		#endregion
	}
}
