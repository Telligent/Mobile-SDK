using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Telligent.Evolution.Mobile.Web.Services;
using System.IO;

namespace Telligent.Evolution.Mobile.Web
{
	public class RootPage : IHttpHandler
	{
		IHtmlService HtmlService = ServiceLocator.Get<IHtmlService>();
		
		#region IHttpHandler Members

		public bool IsReusable
		{
			get { return true; }
		}

		public void ProcessRequest(HttpContext context)
		{
			var host = Host.Get(Host.DefaultId);
			var contextBase = new HttpContextWrapper(context);

			context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
			context.Response.ContentType = "text/html";

			var siteName = "Zimbra Mobile";
			var siteInfo = host.GetRestEndpointXml("info.xml");
			if (siteInfo != null && siteInfo.Element("InfoResult") != null && siteInfo.Element("InfoResult").Element("SiteName") != null)
			{
				siteName = siteInfo.Element("InfoResult").Element("SiteName").Value;
			}

			context.Response.Write(@"<!DOCTYPE html>
<html lang=""en"">
	<head>
		<title>" + HttpUtility.HtmlEncode(siteName) + @"</title>
		<meta http-equiv=""X-UA-Compatible"" content=""IE=edge,chrome=1"">
		<meta name=""apple-mobile-web-app-capable"" content=""yes"" />
		<meta name=""apple-mobile-web-app-status-bar-style"" content=""black-translucent"" />
		<meta name=""viewport"" content=""width=device-width, initial-scale = 1.0, user-scalable = no"">
		<link href=""" + HttpUtility.HtmlAttributeEncode(host.AbsoluteUrl("~/Images/startup-568h.png")) + @""" rel=""apple-touch-startup-image"" media=""(device-height: 568px)"" />
		<link href=""" + HttpUtility.HtmlAttributeEncode(host.AbsoluteUrl("~/Images/startup.png")) + @""" rel=""apple-touch-startup-image"" sizes=""640x920"" media=""(device-height: 480px)"" />
		<link rel=""apple-touch-icon"" href=""" + HttpUtility.HtmlAttributeEncode(host.AbsoluteUrl("~/Images/icon.png")) + @""" />
		");
			context.Response.Write(HtmlService.GetHeaders(contextBase));
			context.Response.Write(@"
	</head>
	<body>");
			context.Response.Write(HtmlService.GetRootBody(contextBase));	
			context.Response.Write(@"
	</body>
</html>");
		}

		#endregion
	}
}