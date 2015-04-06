using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Telligent.Evolution.Mobile.Web.Services;
using System.IO;

namespace Telligent.Evolution.Mobile.Web
{
	public class Callback : IHttpHandler
	{
		IMobileConfiguration _config = ServiceLocator.Get<IMobileConfiguration>();
		IHtmlService _headerService = ServiceLocator.Get<IHtmlService>();

		#region IHttpHandler Members

		public bool IsReusable
		{
			get { return true; }
		}

		public void ProcessRequest(HttpContext context)
		{
			if (context.Request.QueryString["logout"] != null)
			{
				Telligent.Evolution.Extensibility.OAuthClient.Version1.OAuthAuthentication.LogOut(Host.DefaultId);

                if (string.IsNullOrEmpty(_config.EvolutionNetworkUserName) && string.IsNullOrEmpty(_config.EvolutionNetworkPassword) && context.Request.QueryString["evolution"] == null)
                {
                    context.Response.Redirect(Telligent.Evolution.Extensibility.OAuthClient.Version1.OAuthAuthentication.EvolutionLogOut(Host.DefaultId, new System.Collections.Specialized.NameValueCollection()).OriginalString);
                }
                else
                {
                    context.Response.StatusCode = 200;
                    context.Response.ContentType = "application/json";
                    context.Response.Write("{\"success\":true}");
                }
			}
			else if (context.Request.QueryString["login"] != null)
			{
				context.Response.RedirectLocation = Telligent.Evolution.Extensibility.OAuthClient.Version1.OAuthAuthentication.Login(
					Host.DefaultId,
					System.Web.HttpUtility.ParseQueryString(context.Request.QueryString["state"])
					).OriginalString;

				context.Response.StatusCode = 302;
			}
			else if (context.Request.QueryString["native"] != null)
			{
				context.Response.Cache.SetCacheability(HttpCacheability.Private);
				context.Response.ContentType = "text/html";
				context.Response.Write("<html><body></body></html>");
			}
			else if (context.Request.QueryString["authenticate"] != null)
			{
				var host = Host.Get(Host.DefaultId) as Telligent.Evolution.Extensibility.OAuthClient.Version1.IOAuthClientConfiguration;
				host.SetAuthorizationCookie(context.Request.QueryString["authenticate"]);
				context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
				context.Response.ContentType = "application/json";
				context.Response.Write("{\"success\":true}");
			}
			else if (context.Request.QueryString["deauthenticate"] != null)
			{
				var host = Host.Get(Host.DefaultId) as Host;
				host.UnSetAuthorizationCookie();
				context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
				context.Response.ContentType = "application/json";
				context.Response.Write("{\"success\":true}");
			}
			else if (context.Request.QueryString["headers"] != null)
			{
				context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
				context.Response.ContentType = "text/html";

				double? scaleFactor = 1;
				double parsedScaleFactor;
				if (double.TryParse(context.Request.QueryString["scalefactor"] ?? "", out parsedScaleFactor))
					scaleFactor = parsedScaleFactor;
				var host = Host.Get(Host.DefaultId) as Host;
				host.SetDevicePixelRatioCookie(scaleFactor);

				context.Response.Write(_headerService.GetHeaders(new HttpContextWrapper(context)));
			}
			else if (context.Request.QueryString["rootpage"] != null)
			{
				context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
				context.Response.ContentType = "text/html";
				context.Response.Write(_headerService.GetRootBody(new HttpContextWrapper(context)));
			}
			else if (context.Request.QueryString["hostpage"] != null)
			{
				context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
				context.Response.ContentType = "application/json";
				context.Response.Write("{\"redirectUrl\":\"");
				context.Response.Write(System.Web.HttpUtility.JavaScriptStringEncode(context.Request.QueryString["hostpage"]));
				context.Response.Write("\",\"error\":");
				context.Response.Write(context.Request.QueryString["error"] == "true" ? "true" : "false");
				context.Response.Write("}");
			}
			else if (context.Request.QueryString["redirect"] != null)
			{
				string redirectedUrl = null;
				try
				{
					var host = Host.Get(Host.DefaultId) as Host;
					var url = context.Request.QueryString["redirect"];
					string redirectUrl = null;
					bool redirected = host.TryGetNonQualifiedEvolutionRedirectUrl(url, out redirectedUrl);
				}
				catch (Exception) { }
				context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
				context.Response.ContentType = "application/json";
				context.Response.Write("{\"redirectUrl\":\"");
				context.Response.Write(System.Web.HttpUtility.JavaScriptStringEncode(redirectedUrl));
				context.Response.Write("\"}");
			}
		}

		#endregion
	}
}