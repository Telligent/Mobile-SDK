using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Telligent.Evolution.Mobile.Web.Services;
using Telligent.Evolution.Mobile.Web.Model;
using System.IO;
using System.Diagnostics;
using System.Web.Routing;
using System.Text;
using System.Collections;

namespace Telligent.Evolution.Mobile.Web
{
	public class Host : Telligent.Evolution.Extensibility.UI.Version1.RemoteScriptedContentFragmentHost, Telligent.Evolution.Extensibility.OAuthClient.Version1.IOAuthClientConfiguration
	{
		private readonly IMobileConfiguration Config = ServiceLocator.Get<IMobileConfiguration>();
		private readonly IMobileRedirectionService MobileRedirectionService = ServiceLocator.Get<IMobileRedirectionService>();
		private readonly IConfiguredContentFragmentService ConfiguredContentFragmentService = ServiceLocator.Get<IConfiguredContentFragmentService>();
		private readonly string _path;
		private FileSystemWatcher _watcher;
		private Dictionary<string, string> _languageResources;

		private static Guid _id = new Guid("a3c92257-ef7d-4fad-9cd1-61f08752911f");
		private static string _dprCookieName = ".te.dpr";

		public Host()
			: base()
		{
			var dir = new DirectoryInfo(Path.GetDirectoryName(GetType().Assembly.CodeBase).Substring(6));
			_path = Path.Combine(dir.Parent.FullName, "Resources");

			_watcher = new FileSystemWatcher(_path);
			_watcher.Changed += new FileSystemEventHandler(_watcher_Changed);
			_watcher.EnableRaisingEvents = true;

			_languageResources = new Dictionary<string, string>();
			_languageResources["date_minuteago"] = "Now";
			_languageResources["date_minutesago"] = "{0}min";
			_languageResources["date_hourago"] = "1hr";
			_languageResources["date_hoursago"] = "{0}hr";
			_languageResources["date_dayago"] = "1d";
			_languageResources["date_daysago"] = "{0}d";
			_languageResources["date_monthago"] = "1mo";
			_languageResources["date_monthsago"] = "{0}mo";
			_languageResources["date_yearago"] = "1yr";
			_languageResources["date_yearsago"] = "{0}yr";

			Telligent.Evolution.Extensibility.OAuthClient.Version1.OAuthAuthentication.RegisterConfiguration(this);
		}

		internal string FormatAgoDate(DateTime date)
		{
			return ExecuteMethod("core_v2_language", "FormatAgoDate", date).ToString();
		}

		public override string GetSystemLanguageResource(string resourceName)
		{
			string value;
			if (_languageResources.TryGetValue(resourceName, out value))
				return value;
			else
				return base.GetSystemLanguageResource(resourceName);
		}

		void _watcher_Changed(object sender, FileSystemEventArgs e)
		{
			ExpireCaches();
		}

		public override Guid Id
		{
			get { return _id; }
		}

		public override string CallbackUrl
		{
			get { return AbsoluteUrl("~/rsw.ashx"); }
		}

		public override string EvolutionRootUrl
		{
			get { return Config.EvolutionUrl; }
		}

		private Telligent.Evolution.Extensibility.OAuthClient.Version1.User GetAccessingUser()
		{
			var context = HttpContext.Current;

			var user = context.Items["Mobile-User"] as Telligent.Evolution.Extensibility.OAuthClient.Version1.User;
			if (user == null)
			{
				user = Telligent.Evolution.Extensibility.OAuthClient.Version1.OAuthAuthentication.GetAuthenticatedUser(this.Id);
				if (user == null)
					user = Telligent.Evolution.Extensibility.OAuthClient.Version1.OAuthAuthentication.GetDefaultUser(this.Id);

				context.Items["Mobile-User"] = user;
			}

			return user;
		}

		public override void ApplyAuthenticationToHostRequest(System.Net.HttpWebRequest request, bool forAccessingUser)
		{
			Telligent.Evolution.Extensibility.OAuthClient.Version1.User user = null;
			
			if (forAccessingUser)
				user = GetAccessingUser();

			if (user == null)
				user = Telligent.Evolution.Extensibility.OAuthClient.Version1.OAuthAuthentication.GetDefaultUser(this.Id);

			Telligent.Evolution.Extensibility.OAuthClient.Version1.OAuthAuthentication.ApplyAuthenticationToRequest(this.Id, user, request);
		}

		public override string SourceFileScriptedContentFragmentRootNodeXPath
		{
			get
			{
				return "descendant::scriptedContentFragments";
			}
		}

		public override IEnumerable<Telligent.Evolution.Extensibility.Storage.Version1.IFile> GetSourceFiles()
		{
			List<Telligent.Evolution.Extensibility.Storage.Version1.IFile> files = new List<Telligent.Evolution.Extensibility.Storage.Version1.IFile>();

			foreach (var file in System.IO.Directory.EnumerateFiles(_path, "*.xml"))
			{
				files.Add(new File(file, string.Empty));
			}

			return files;
		}

		public override Telligent.Evolution.Extensibility.Storage.Version1.IFile GetFile(Guid instanceIdentifier, string fileName)
		{
			var cacheKey = string.Concat("Files:", instanceIdentifier.ToString("N"));
			var files = Cache.Get(cacheKey) as IEnumerable<Telligent.Evolution.Extensibility.Storage.Version1.IFile>;
			if (files == null)
			{
				files = GetFilesFromSourceFile(instanceIdentifier);
				if (files != null)
					Cache.Put(cacheKey, files, 60 * 30);
			}

			return files.FirstOrDefault(x => x.FileName == fileName);
		}

		public override string GetAccessingUserLanguageKey()
		{
			var user = GetAccessingUser();
			if (user != null)
				return user.LanguageKey;
			else
				return Config.DefaultUserLanguageKey;
		}

		public override IEnumerable<Telligent.Evolution.Extensibility.UI.Version1.IScriptedContentFragmentExtension> Extensions
		{
			get 
			{
				var extensions = new List<Telligent.Evolution.Extensibility.UI.Version1.IScriptedContentFragmentExtension>(PlatformExtensions);
				
				extensions.Add(new Extensions.RemoteAuthenticationExtension());
				extensions.Add(new Extensions.UrlTokenExtension());
				extensions.Add(new Extensions.MobileUiExtension());
				extensions.Add(new Extensions.MobileUrlExtension());
				extensions.Add(new Extensions.MobileDataFormatExtension());
				extensions.AddRange(Config.Extensions);

				return extensions;			
			}
		}

		public override void LogError(string message, Exception ex)
		{
			try
			{
				if (EventLog.SourceExists("Application"))
					EventLog.WriteEntry("Application", string.Concat("Telligent Mobile Exception\n\n", message ?? "", "\n\n", ex.ToString()), EventLogEntryType.Error);
			}
			catch
			{
				// ignore -- don't throw from a log process
			}
		}

		internal void SetRequestContext(RequestContext requestContext)
		{
			GetCurrentHttpContext().Items["_requestContext"] = requestContext;
		}

		public override string SerializeContext(HttpContextBase context)
		{
			var requestContext = context.Items["_requestContext"] as RequestContext;
			StringBuilder routeData = new StringBuilder();
			if (requestContext != null && requestContext.RouteData != null && requestContext.RouteData.DataTokens != null)
			{
				foreach (var token in requestContext.RouteData.Values)
				{
					if (token.Value != null)
					{
						if (routeData.Length > 0)
							routeData.Append("&");

						routeData.Append(Uri.EscapeDataString(token.Key));
						routeData.Append("=");
						routeData.Append(Uri.EscapeDataString(token.Value.ToString()));
					}
				}
			}

			return routeData.ToString();
		}

		public override void DeserializeContext(HttpContextBase context, string contextData)
		{
			context.Items["_requestData"] = HttpUtility.ParseQueryString(contextData);
		}

		public string GetUrlTokenValue(string tokenName)
		{
			var context = GetCurrentHttpContext();

			var requestData = context.Items["_requestData"] as System.Collections.Specialized.NameValueCollection;
			if (requestData != null)
				return requestData.Get(tokenName);

			var requestContext = context.Items["_requestContext"] as RequestContext;
			if (requestContext != null && requestContext.RouteData != null && requestContext.RouteData.Values != null && requestContext.RouteData.Values.ContainsKey(tokenName))
			{
				var data = requestContext.RouteData.Values[tokenName];
				if (data == null)
					return null;
				else
					return data.ToString();
			}

			return null;
		}

		public string[] GetUrlTokenNames()
		{
			var context = GetCurrentHttpContext();

			var requestData = context.Items["_requestData"] as System.Collections.Specialized.NameValueCollection;
			if (requestData != null)
				return requestData.AllKeys;

			var requestContext = context.Items["_requestContext"] as RequestContext;
			if (requestContext != null && requestContext.RouteData != null && requestContext.RouteData.Values != null)
				return requestContext.RouteData.Values.Keys.ToArray();

			return new string[0];
		}

		public override string GetConfiguration(string hostIdentifier)
		{
			var config = (string) GetCurrentHttpContext().Items[string.Concat("_configuration:", hostIdentifier)];
			if (config == null)
			{
				var fragment = ConfiguredContentFragmentService.GetByHostIdentifier(hostIdentifier);
				if (fragment != null)
					config = fragment.Configuration;
			}

			return config ?? string.Empty;
		}

		internal void SetConfiguration(string hostIdentifier, string configuration)
		{
			GetCurrentHttpContext().Items[string.Concat("_configuration:", hostIdentifier)] = configuration;
		}

		public override bool GetAccessingUserIsAuthenticated()
		{
			var user = GetAccessingUser();

			return (user != null && string.Compare(user.UserName, Config.DefaultUserName) != 0);
		}

		public static Guid DefaultId { get { return _id; } }

		public override string GetEvolutionRedirectUrl(string url)
		{
			string redirectUrl;
			bool error = TryGetNonQualifiedEvolutionRedirectUrl(url, out redirectUrl);

			return AbsoluteUrl(string.Concat("~/callback.ashx?hostpage=", Uri.EscapeDataString(redirectUrl), "&error=", error ? "true" : "false"));
		}

		internal bool TryGetNonQualifiedEvolutionRedirectUrl(string url, out string redirectUrl)
		{
			bool error = false;

			try
			{
				if (MobileRedirectionService.TryGetRedirectUrl(this, url, out redirectUrl))
					redirectUrl = AbsoluteUrl(redirectUrl);
				else
					redirectUrl = null;

				if (redirectUrl == null)
					redirectUrl = GetDirectEvolutionRedirectUrl(url);
			}
			catch
			{
				error = true;
				redirectUrl = url;
			}

			return error;
		}

		internal string GetDirectEvolutionRedirectUrl(string url)
		{
			return Telligent.Evolution.Extensibility.OAuthClient.Version1.OAuthAuthentication.AuthenticatedRedirect(Id, base.GetEvolutionRedirectUrl(url)).OriginalString;
		}

		#region IOAuthClientConfiguration Members

		public string DefaultUserLanguageKey
		{
			get { return Config.DefaultUserLanguageKey; }
		}

		public string DefaultUserName
		{
			get { return Config.DefaultUserName; }
		}

		public bool EnableEvolutionUserSynchronization
		{
			get { return false; }
		}

		public Uri EvolutionBaseUrl
		{
			get { return new Uri(Config.EvolutionUrl); }
		}

		public System.Net.NetworkCredential EvolutionCredentials
		{
			get 
			{
				if (!string.IsNullOrEmpty(Config.EvolutionNetworkUserName) && !string.IsNullOrEmpty(Config.EvolutionNetworkPassword))
					return new System.Net.NetworkCredential(Config.EvolutionNetworkUserName, Config.EvolutionNetworkPassword, Config.EvolutionNetworkDomain);
				else
					return null;
			}
		}

		public string GetAuthorizationCookieValue()
		{
			HttpContext context = HttpContext.Current;
			HttpRequest request = null;
			try
			{
				request = context.Request;
			}
			catch
			{
			}

			if (request != null)
			{
				var cookie = request.Cookies[Config.AuthorizationCookieName];
				if (cookie != null)
					return cookie.Value;

				if (!string.IsNullOrEmpty(request.Headers[Config.AuthorizationCookieName]))
					return request.Headers[Config.AuthorizationCookieName];
			}

			return null;
		}

		public Uri LocalOAuthClientHttpHandlerUrl
		{
			get { return new Uri(AbsoluteUrl("~/oauth.ashx")); }
		}

		public Dictionary<string, string> LocalUserDetails
		{
			get { return null; }
		}

		public string LocalUserEmailAddress
		{
			get { return null; }
		}

		public string LocalUserName
		{
			get { return null; }
		}

		public string OAuthClientId
		{
			get { return Config.OAuthClientId; }
		}

		public string OAuthClientSecret
		{
			get { return Config.OAuthClientSecret; }
		}

		public void UnSetAuthorizationCookie()
		{
			HttpContext context = HttpContext.Current;
			HttpResponse response = null;
			try
			{
				response = context.Response;
			}
			catch { }

			if (response != null)
			{
				var cookie = response.Cookies[Config.AuthorizationCookieName];
				if (cookie != null)
					response.Cookies.Remove(cookie.Name);

				cookie = new HttpCookie(Config.AuthorizationCookieName);
				cookie.HttpOnly = true;
				cookie.Expires = DateTime.Now.AddDays(-1);
				response.Cookies.Add(cookie);
			}
		}

		public void SetAuthorizationCookie(string value)
		{
			HttpContext context = HttpContext.Current;
			HttpResponse response = null;
			try
			{
				response = context.Response;
			}
			catch
			{
			}

			if (response != null)
			{
				var cookie = response.Cookies[Config.AuthorizationCookieName];

				if (cookie != null)
					response.Cookies.Remove(cookie.Name);

				cookie = new HttpCookie(Config.AuthorizationCookieName);
				cookie.HttpOnly = true;
				if (!string.IsNullOrEmpty(value))
				{
					cookie.Value = value;
					cookie.Expires = DateTime.Now.AddDays(30);
				}
				else
				{
					cookie.Value = string.Empty;
					cookie.Expires = DateTime.Now.AddDays(-30);
				}

				response.Cookies.Add(cookie);
			}
		}

		public void SetDevicePixelRatioCookie(double? scaleFactor)
		{
			HttpContext context = HttpContext.Current;
			HttpResponse response = null;
			try
			{
				response = context.Response;
			}
			catch
			{
			}

			if (response != null)
			{
				var cookie = response.Cookies[_dprCookieName];

				if (cookie != null)
					response.Cookies.Remove(cookie.Name);

				cookie = new HttpCookie(_dprCookieName);
				cookie.HttpOnly = true;
				if (scaleFactor.HasValue)
				{
					var effectiveScaleFactor = Math.Round(scaleFactor.GetValueOrDefault(1));
					if (effectiveScaleFactor == 0)
						effectiveScaleFactor = 1;

					cookie.Value = scaleFactor.ToString();
					cookie.Expires = DateTime.Now.AddYears(30);
				}
				else
				{
					cookie.Value = string.Empty;
					cookie.Expires = DateTime.Now.AddYears(-30);
				}

				response.Cookies.Add(cookie);
			}
		}

		public void UserLoggedIn(System.Collections.Specialized.NameValueCollection state)
		{
			var context = HttpContext.Current;

			if (state["client"] == "standalone")
			{
				context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
				context.Response.ContentType = "text/html";
				context.Response.Write("<html><head><script type=\"text/javascript\">try { window.parent.document.location.reload(true); } catch (e) { }</script></head><body></body></html>");
			}
			else if (state["client"] == "native")
			{
				context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
				if (!string.IsNullOrEmpty(Config.EvolutionNetworkUserName))
				{
					context.Response.ContentType = "text/html";
					context.Response.Write("<html><head><script type=\"text/javascript\">window.setTimeout(function() { window.close(); }, 499);window.location ='");
					context.Response.Write(Config.UrlScheme + "://auth?native=login&header=" + Uri.EscapeDataString(Config.AuthorizationCookieName) + "&token=" + Uri.EscapeDataString(GetAuthorizationCookieValue() ?? string.Empty) + "&state=" + (context.Request.QueryString["state"]));
					context.Response.Write("';</script></head><body><body></html>");
				}
				else
				{
					context.Response.ContentType = "text/html";
					context.Response.Write("<html><head><script type=\"text/javascript\"> window.location = '");
					context.Response.Write(AbsoluteUrl("~/callback.ashx?native=login&header=" + Uri.EscapeDataString(Config.AuthorizationCookieName) + "&token=" + Uri.EscapeDataString(GetAuthorizationCookieValue() ?? string.Empty) + "&state=" + (context.Request.QueryString["state"])));
					context.Response.Write("'; </script></head><body><body></html>");
				}
			}
			else
			{
				context.Response.Cache.SetCacheability(HttpCacheability.NoCache);

				if (!string.IsNullOrEmpty(state["url"]))
					context.Response.RedirectLocation = state["url"];
				else
					context.Response.RedirectLocation = AbsoluteUrl("~/");

				context.Response.StatusCode = 302;
			}
		}

		public void UserLoginFailed(System.Collections.Specialized.NameValueCollection state)
		{
			var context = HttpContext.Current;

			if (state["client"] == "standalone")
			{
				context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
				context.Response.ContentType = "text/html";
				context.Response.Write("<html><head><script type=\"text/javascript\">try { window.parent.document.location.reload(true); } catch (e) { }</script></head><body></body></html>");
			}
			else if (state["client"] == "native")
			{
				context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
				context.Response.ContentType = "text/html";
				context.Response.Write("<html><head><script type=\"text/javascript\"> window.location = '");
				context.Response.Write(AbsoluteUrl("~/callback.ashx?native=logout&state=" + (context.Request.QueryString["state"])));
				context.Response.Write("'; </script></head><body><body></html>");
			}
			else
			{
				context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
				context.Response.RedirectLocation = AbsoluteUrl("~/?state=" + (context.Request.QueryString["state"] != null ? Uri.EscapeDataString(context.Request.QueryString["state"]) : ""));
				context.Response.StatusCode = 302;
			}
		}

		public void UserCreationFailed(string username, string emailAddress, IDictionary<string, string> userData, string message, Evolution.Extensibility.OAuthClient.Version1.ErrorResponse errorResponse)
		{
		}

		public bool EnableEvolutionUserCreation
		{
			get { return false; }
		}

		public string EvolutionUserCreationManagementUserName
		{
			get { return null; }
		}

		public string GetEvolutionUserSynchronizationCookieValue()
		{
			return null;
		}

		public void UserLogOutFailed(System.Collections.Specialized.NameValueCollection state)
		{
            GetCurrentHttpContext().Response.Redirect(AbsoluteUrl("~/callback.ashx?logout=true&evolution=true"));
		}

		public void UserLoggedOut(System.Collections.Specialized.NameValueCollection state)
		{
            GetCurrentHttpContext().Response.Redirect(AbsoluteUrl("~/callback.ashx?logout=true&evolution=true"));
		}

		#endregion
	}

	public class File : Telligent.Evolution.Extensibility.Storage.Version1.IFile
	{
		System.IO.FileInfo _file;
		string _url;

		public File(string path, string url)
		{
			_file = new System.IO.FileInfo(path);
			_url = url;
		}

		public int ContentLength
		{
			get { return (int)_file.Length; }
		}

		public string FileName
		{
			get { return _file.Name; }
		}

		public System.IO.Stream OpenReadStream()
		{
			return _file.OpenRead();
		}

		public string GetDownloadUrl()
		{
			return _url;
		}
	}
}