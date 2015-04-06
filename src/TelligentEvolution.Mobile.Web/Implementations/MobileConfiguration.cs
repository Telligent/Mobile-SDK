using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Telligent.Evolution.Mobile.Web.Services;
using Telligent.Evolution.Mobile.Web.Configuration;
using System.Configuration;
using Telligent.Evolution.Extensibility.UI.Version1;
using Telligent.Evolution.Mobile.Web.Model;
using System.IO;
using System.Xml;
using System.Timers;

namespace Telligent.Evolution.Mobile.Web.Implementations
{
	internal class MobileConfiguration : IMobileConfiguration
	{
		private readonly object _settingsLock = new object();
		private FileSystemWatcher _watcher;
		private string _path;
		private DateTime _lastModified = DateTime.MinValue;

		static Timer _cacheInvalidatorThrottleTimer = null;
		static DateTime? _shouldInvalidateCacheAfter = null;
		static readonly object _cacheInvalidationLock = new object();

		internal MobileConfiguration()
		{
			var config = ConfigurationManager.GetSection("mobile") as MobileConfigurationSection;
			if (config != null)
			{
				EvolutionUrl = config.EvolutionUrl;
				EvolutionNetworkDomain = config.NetworkDomain;
				EvolutionNetworkPassword = config.NetworkPassword;
				EvolutionNetworkUserName = config.NetworkUserName;
				OAuthClientId = config.OAuth.ClientId;
				OAuthClientSecret = config.OAuth.ClientSecret;
				DefaultUserName = config.DefaultUser.UserName;
				DefaultUserLanguageKey = config.DefaultUser.LanguageKey;
				AuthorizationCookieName = config.Authorization.CookieName;
				AllowAnonymous = config.Authorization.AllowAnonymous;
				LoginPage = config.Authorization.LoginPage;
				UrlScheme = config.UrlScheme;

				if (config.DataFormats != null && config.DataFormats.Telephone != null && !string.IsNullOrEmpty(config.DataFormats.Telephone.Pattern))
					TelephonePattern = config.DataFormats.Telephone.Pattern;
				else
					TelephonePattern = @"(?:(?:\(?(?:00|\+)?(?:[1-4]\d\d|[1-9]\d?)\)?)?[\-\.\s\\\/]?)?(?:(?:\(?\d{3,}\)?[\-\.\s\\\/]?){2,})";
			}

			var dir = new DirectoryInfo(Path.GetDirectoryName(GetType().Assembly.CodeBase).Substring(6));
			_path = Path.Combine(dir.Parent.FullName, "Resources");

			_watcher = new FileSystemWatcher(_path);
			_watcher.Changed += (sender, e) => _shouldInvalidateCacheAfter = DateTime.Now.AddMilliseconds(500);
			_watcher.EnableRaisingEvents = true;

			// debounce cache invalidation to not pick up multiple changes when many files are 
			// added or removed at once from /Resources
			_cacheInvalidatorThrottleTimer = new Timer(100);
			_cacheInvalidatorThrottleTimer.Elapsed += (sender, e) =>
			{
				try
				{
					lock (_cacheInvalidationLock)
					{
						if (_shouldInvalidateCacheAfter != null && DateTime.Now > _shouldInvalidateCacheAfter)
						{
							_shouldInvalidateCacheAfter = null;
							UpdateSettings();
							Host.Get(Host.DefaultId).ExpireCaches();
						}
					}
				}
				catch (Exception)
				{
				}
			};
			_cacheInvalidatorThrottleTimer.Start();

			UpdateSettings();
		}

		#region Settings Helpers

		private void UpdateSettings()
		{
			List<IScriptedContentFragmentExtension> extensions = new List<IScriptedContentFragmentExtension>();
			List<EntityUrl> entityUrls = new List<EntityUrl>();
			List<string> styleSheets = new List<string>();
			List<string> javaScripts = new List<string>();
			List<EmbeddedFile> files = new List<EmbeddedFile>();

			foreach (var file in System.IO.Directory.EnumerateFiles(_path, "*.xml").OrderBy(x => x))
			{
				var fileInfo = new FileInfo(file);
				if (fileInfo != null)
				{
					var lastModified = fileInfo.LastWriteTimeUtc;
					if (lastModified > _lastModified)
						_lastModified = lastModified;

					using (Stream stream = fileInfo.OpenRead())
					{
						XmlDocument document = new XmlDocument();
						XmlReaderSettings settings = new XmlReaderSettings();
						settings.DtdProcessing = DtdProcessing.Prohibit;
						document.Load(XmlReader.Create(stream, settings));

						var node = document.SelectSingleNode("descendant::entityUrls");
						if (node != null)
							LoadEntityUrls(node, entityUrls);

						node = document.SelectSingleNode("descendant::extensions");
						if (node != null)
							LoadExtensions(node, extensions);

						node = document.SelectSingleNode("descendant::styleSheets");
						if (node != null)
							LoadStyleSheets(node, styleSheets);

						node = document.SelectSingleNode("descendant::javaScripts");
						if (node != null)
							LoadJavaScripts(node, javaScripts);

						node = document.SelectSingleNode("descendant::embeddedFiles");
						if (node != null)
							LoadEmbeddedFiles(node, files);
					}
				}
			}

			Extensions = extensions.ToArray();
			EntityUrls = entityUrls.ToArray();
			StyleSheets = styleSheets.ToArray();
			JavaScripts = javaScripts.ToArray();
			EmbeddedFiles = files.ToArray();
		}

		private void LoadExtensions(XmlNode parentNode, List<IScriptedContentFragmentExtension> extensions)
		{
			foreach (XmlNode node in parentNode.ChildNodes)
			{
				if (node.Name == "extension")
				{
					var typeName = node.Attributes["type"] != null ? node.Attributes["type"].Value : null;
					if (!string.IsNullOrEmpty(typeName))
					{
						var type = Type.GetType(typeName, false);
						if (type != null)
						{
							var extension = Activator.CreateInstance(type) as IScriptedContentFragmentExtension;
							if (extension != null)
								extensions.Add(extension);
						}
					}
				}
			}
		}

		private void LoadEntityUrls(XmlNode parentNode, List<EntityUrl> entityUrls)
		{
			foreach (XmlNode node in parentNode.ChildNodes)
			{
				if (node.Name == "entityUrl")
				{
					var url = node.Attributes["url"] != null ? node.Attributes["url"].Value : null;

					if (!string.IsNullOrEmpty(url))
						entityUrls.Add(new EntityUrl { 
							Url = url, 
							Requirements = LoadEntityUrlRequirements(node), 
							Tokens = LoadEntityUrlTokens(node) 
						});
				}
			}
		}

		private EntityUrlRequirement[] LoadEntityUrlRequirements(XmlNode parentNode)
		{
			List<EntityUrlRequirement> requirements = new List<EntityUrlRequirement>();

			foreach (XmlNode node in parentNode.SelectNodes("descendant::requirements/requirement"))
			{
				var entity = node.Attributes["entityType"] != null ? node.Attributes["entityType"].Value : null;
				var idEquals = node.Attributes["idEquals"] != null ? node.Attributes["idEquals"].Value : null;
				var relationship = node.Attributes["relationship"] != null ? node.Attributes["relationship"].Value : null;
				var containerTypeIdEquals = node.Attributes["containerTypeIdEquals"] != null ? (Guid?) Guid.Parse(node.Attributes["containerTypeIdEquals"].Value) : (Guid?) null;
				var applicationTypeIdEquals = node.Attributes["applicationTypeIdEquals"] != null ? (Guid?) Guid.Parse(node.Attributes["applicationTypeIdEquals"].Value) : (Guid?) null;

				if (!string.IsNullOrEmpty(entity) && (idEquals != null || containerTypeIdEquals != null || applicationTypeIdEquals != null))
					requirements.Add(new EntityUrlRequirement { 
						EntityType = entity, 
						IdEquals = idEquals, 
						ContainerTypeIdEquals = containerTypeIdEquals, 
						ApplicationTypeIdEquals = applicationTypeIdEquals, 
						Relationship = string.IsNullOrEmpty(relationship) ? null : relationship
					});
			}

			return requirements.ToArray();
		}

		private EntityUrlToken[] LoadEntityUrlTokens(XmlNode parentNode)
		{
			List<EntityUrlToken> tokens = new List<EntityUrlToken>();

			foreach (XmlNode node in parentNode.SelectNodes("descendant::tokens/token"))
			{
				var name = node.Attributes["name"] != null ? node.Attributes["name"].Value : null;
				var entity = node.Attributes["entityType"] != null ? node.Attributes["entityType"].Value : null;
				var relationship = node.Attributes["relationship"] != null ? node.Attributes["relationship"].Value : null;

				if (!string.IsNullOrEmpty(name) && !string.IsNullOrEmpty(entity))
					tokens.Add(new EntityUrlToken { 
						EntityType = entity, 
						Name = name,
						Relationship = string.IsNullOrEmpty(relationship) ? null : relationship
					});
			}

			return tokens.ToArray();
		}

		private void LoadStyleSheets(XmlNode parentNode, List<string> styleSheets)
		{
			foreach (XmlNode node in parentNode.ChildNodes)
			{
				if (node.Name == "styleSheet")
				{
					var styleSheet = node.InnerText;
					if (!string.IsNullOrEmpty(styleSheet))
						styleSheets.Add(styleSheet);
				}
			}
		}

		private void LoadJavaScripts(XmlNode parentNode, List<string> javaScripts)
		{
			foreach (XmlNode node in parentNode.ChildNodes)
			{
				if (node.Name == "javaScript")
				{
					var javaScript = node.InnerText;
					if (!string.IsNullOrEmpty(javaScript))
						javaScripts.Add(javaScript);
				}
			}
		}

		private void LoadEmbeddedFiles(XmlNode parentNode, List<EmbeddedFile> files)
		{
			foreach (XmlNode node in parentNode.ChildNodes)
			{
				if (node.Name == "embeddedFile")
				{
					var name = node.Attributes["name"] == null ? null : node.Attributes["name"].Value;
					var mimeType = node.Attributes["type"] == null ? null : node.Attributes["type"].Value;
					var isBase64 = node.Attributes["base64"] == null ? false : string.Compare(node.Attributes["base64"].Value, "true", StringComparison.OrdinalIgnoreCase) == 0;
					var data = node.InnerText;

					if (!string.IsNullOrEmpty(name))
					{
						files.Add(new EmbeddedFile(
							name,
							string.IsNullOrEmpty(mimeType) ? "application/octet-stream" : mimeType,
							isBase64 ? Convert.FromBase64String(data) : Encoding.UTF8.GetBytes(data)
							));
					}
				}
			}
		}	

		#endregion

		#region IMobileConfiguration Members

		public string EvolutionUrl { get; private set; }
		public string EvolutionNetworkUserName { get; private set; }
		public string EvolutionNetworkPassword { get; private set; }
		public string EvolutionNetworkDomain { get; private set; }
		public string OAuthClientId { get; private set; }
		public string OAuthClientSecret { get; private set; }
		public string DefaultUserName { get; private set; }
		public string DefaultUserLanguageKey { get; private set; }
		public string AuthorizationCookieName { get; private set; }
		public bool AllowAnonymous { get; set; }
		public string LoginPage { get; private set; }
		public DateTime LastModifiedDateUtc { get { return _lastModified; } }
		public string UrlScheme { get; private set; }
		public string TelephonePattern { get; private set; }

		private IScriptedContentFragmentExtension[] _extensions;
		public IScriptedContentFragmentExtension[] Extensions
		{
			get
			{
				lock (_settingsLock)
				{
					return _extensions;
				}
			}
			private set
			{
				lock (_settingsLock)
				{
					_extensions = value;
				}
			}
		}

		private EmbeddedFile[] _embeddedFiles;
		public EmbeddedFile[] EmbeddedFiles
		{
			get
			{
				lock (_settingsLock)
				{
					return _embeddedFiles;
				}
			}
			private set
			{
				lock (_settingsLock)
				{
					_embeddedFiles = value;
				}
			}
		}

		private EntityUrl[] _entityUrls;
		public EntityUrl[] EntityUrls
		{
			get
			{
				lock (_settingsLock)
				{
					return _entityUrls;
				}
			}
			private set
			{
				lock (_settingsLock)
				{
					_entityUrls = value;
				}
			}
		}

		private string[] _styleSheets;
		public string[] StyleSheets
		{
			get
			{
				lock (_settingsLock)
				{
					return _styleSheets;
				}
			}
			private set
			{
				lock (_settingsLock)
				{
					_styleSheets = value;
				}
			}
		}

		private string[] _javaScripts;
		public string[] JavaScripts
		{
			get
			{
				lock (_settingsLock)
				{
					return _javaScripts;
				}
			}
			private set
			{
				lock (_settingsLock)
				{
					_javaScripts = value;
				}
			}
		}

		#endregion
	}
}
