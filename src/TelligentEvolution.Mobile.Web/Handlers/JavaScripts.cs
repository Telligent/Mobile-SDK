using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Telligent.Evolution.Mobile.Web.Services;
using System.IO;

namespace Telligent.Evolution.Mobile.Web
{
	public class JavaScripts : IHttpHandler
	{
		IMobileConfiguration Configuration = ServiceLocator.Get<IMobileConfiguration>();

		#region IHttpHandler Members

		public bool IsReusable
		{
			get { return true; }
		}

		public void ProcessRequest(HttpContext context)
		{
			var lastModifiedDateUtc = Configuration.LastModifiedDateUtc;
			if (lastModifiedDateUtc > DateTime.UtcNow)
				lastModifiedDateUtc = DateTime.UtcNow;

			context.Response.Cache.SetAllowResponseInBrowserHistory(true);
			context.Response.Cache.SetLastModified(lastModifiedDateUtc);
			context.Response.Cache.SetETag(lastModifiedDateUtc.Ticks.ToString());
			context.Response.Cache.SetCacheability(HttpCacheability.Public);
			context.Response.Cache.SetExpires(DateTime.UtcNow.AddHours(2));
			context.Response.Cache.SetValidUntilExpires(false);
			context.Response.ContentType = "text/javascript";

			var scripts = Configuration.JavaScripts;
			if (scripts != null)
				context.Response.Write(UpdateEmbeddedFileReferences(context, string.Join("\n", scripts)));
		}

		#endregion

		private string UpdateEmbeddedFileReferences(HttpContext context, string js)
		{
            return js.Replace("embeddedfile:", HttpUtility.JavaScriptStringEncode(Host.Get(Host.DefaultId).AbsoluteUrl("~/embeddedfile/")));
		}
	}
}