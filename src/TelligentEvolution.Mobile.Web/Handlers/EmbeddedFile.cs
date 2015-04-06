using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Telligent.Evolution.Mobile.Web.Services;
using System.IO;

namespace Telligent.Evolution.Mobile.Web
{
	public class EmbeddedFileHandler : IHttpHandler
	{
		IMobileConfiguration Configuration = ServiceLocator.Get<IMobileConfiguration>();
		
		#region IHttpHandler Members

		public bool IsReusable
		{
			get { return true; }
		}

		public void ProcessRequest(HttpContext context)
		{
			var host = Host.Get(Host.DefaultId);
			string filename = context.Request.RawUrl.Substring(context.Request.RawUrl.IndexOf("embeddedfile/") + 13);
			var file = Configuration.EmbeddedFiles.FirstOrDefault(x => string.Compare(x.Name, filename, StringComparison.OrdinalIgnoreCase) == 0);

			var lastModifiedDateUtc = Configuration.LastModifiedDateUtc;
			if (lastModifiedDateUtc > DateTime.UtcNow)
				lastModifiedDateUtc = DateTime.UtcNow;

			context.Response.Cache.SetAllowResponseInBrowserHistory(true);
			context.Response.Cache.SetLastModified(lastModifiedDateUtc);
			context.Response.Cache.SetETag(lastModifiedDateUtc.Ticks.ToString());
			context.Response.Cache.SetCacheability(HttpCacheability.Public);
			context.Response.Cache.SetExpires(DateTime.UtcNow.AddHours(2));
			context.Response.Cache.SetValidUntilExpires(false);

			if (file == null)
			{
				context.Response.StatusCode = 404;
			}
			else
			{
				context.Response.ContentType = file.MimeType;
				context.Response.BinaryWrite(file.Data);
			}
		}

		#endregion
	}
}