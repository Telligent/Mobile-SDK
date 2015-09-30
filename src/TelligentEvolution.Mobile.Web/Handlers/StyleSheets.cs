using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Telligent.Evolution.Mobile.Web.Services;
using System.IO;
using System.Text;

namespace Telligent.Evolution.Mobile.Web
{
	public class StyleSheets : IHttpHandler
	{
		IMobileConfiguration Configuration = ServiceLocator.Get<IMobileConfiguration>();
		private readonly string CacheKey = "StyleSheets-";
		
		#region IHttpHandler Members

		public bool IsReusable
		{
			get { return true; }
		}

		public void ProcessRequest(HttpContext context)
		{
			var host = Host.Get(Host.DefaultId);

			var lastModifiedDateUtc = Configuration.LastModifiedDateUtc;
			if (lastModifiedDateUtc > DateTime.UtcNow)
				lastModifiedDateUtc = DateTime.UtcNow;

			context.Response.ContentType = "text/css";
            var cacheKey = CacheKey + host.AbsoluteUrl("~/");

			var cachedStyleSheet = host.Cache.Get(cacheKey) as CachedStyleSheet;
			if (cachedStyleSheet == null || cachedStyleSheet.LastModifiedDateUtc < lastModifiedDateUtc)
			{
				cachedStyleSheet = new CachedStyleSheet();
				cachedStyleSheet.LastModifiedDateUtc = lastModifiedDateUtc;
				cachedStyleSheet.StyleSheet = string.Empty;

				var styleSheets = Configuration.StyleSheets;
				if (styleSheets != null)
				{
					var less = string.Join("\n", styleSheets);

					var config = new dotless.Core.configuration.DotlessConfiguration();
					config.CacheEnabled = false;
					config.Debug = false;
					config.DisableParameters = false;
					config.DisableUrlRewriting = true;
					config.DisableVariableRedefines = false;
					config.HandleWebCompression = false;
					config.ImportAllFilesAsLess = false;
					config.InlineCssFiles = false;
					config.KeepFirstSpecialComment = false;
					config.MapPathsToWeb = false;
					config.MinifyOutput = false;
					config.Web = false;
					config.LessSource = typeof(LessFileReader);
					config.LogLevel = dotless.Core.Loggers.LogLevel.Warn;
					config.Logger = typeof(DotLessLogger);
					config.SessionMode = dotless.Core.configuration.DotlessSessionStateMode.Disabled;

					try
					{
						var engine = new dotless.Core.EngineFactory(config).GetEngine();

						cachedStyleSheet.StyleSheet = engine.TransformToCss(UpdateEmbeddedFileReferences(context, less), null) + ((DotLessLogger)((dotless.Core.LessEngine)((dotless.Core.ParameterDecorator)engine).Underlying).Logger).GetMessages();
					}
					catch (Exception ex)
					{
						host.LogError("An error occurred while processing LESS directives in stylesheets.", ex);
						context.Response.StatusCode = 500;
						return;
					}
				}

				host.Cache.Put(cacheKey, cachedStyleSheet, 30 * 60);
			}

			context.Response.Cache.SetAllowResponseInBrowserHistory(true);
			context.Response.Cache.SetLastModified(lastModifiedDateUtc);
			context.Response.Cache.SetETag(lastModifiedDateUtc.Ticks.ToString());
			context.Response.Cache.SetCacheability(HttpCacheability.Public);
			context.Response.Cache.SetExpires(DateTime.UtcNow.AddHours(2));
			context.Response.Cache.SetValidUntilExpires(false);
			context.Response.Write(cachedStyleSheet.StyleSheet);
		}

		#endregion

		private string UpdateEmbeddedFileReferences(HttpContext context, string css)
		{
			return css.Replace("embeddedfile:", Host.Get(Host.DefaultId).AbsoluteUrl("~/embeddedfile/"));
		}

		public class CachedStyleSheet
		{
			public string StyleSheet { get; set; }
			public DateTime LastModifiedDateUtc { get; set; }
		}

		public class LessFileReader : dotless.Core.Input.IFileReader
		{
			public LessFileReader()
			{
			}

			#region IFileReader Members

			public bool DoesFileExist(string fileName)
			{
				return false;
			}

			public byte[] GetBinaryFileContents(string fileName)
			{
				return new byte[0];
			}

			public string GetFileContents(string fileName)
			{
				return string.Empty;
			}

			#endregion
		}

		public class DotLessLogger : dotless.Core.Loggers.Logger
		{
			StringBuilder _messages;

			public DotLessLogger(dotless.Core.Loggers.LogLevel level)
				: base(level)
			{
				_messages = new StringBuilder();
			}

			protected override void Log(string message)
			{
				_messages.Append(message).Append("\r\n");
			}

			internal string GetMessages()
			{
				if (_messages.Length > 0)
				{
					return string.Concat("/*\r\n", _messages.ToString().Replace("*/", "/"), "\r\n*/\r\n");
				}
				else
					return string.Empty;
			}
		}
	}
}