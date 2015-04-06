using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Telligent.Evolution.Mobile.Web.Services;
using System.IO;

namespace Telligent.Evolution.Mobile.Web
{
	public class FormatAgoDate : IHttpHandler
	{
		#region IHttpHandler Members

		public bool IsReusable
		{
			get { return true; }
		}

		public void ProcessRequest(HttpContext context)
		{
			var host = Host.Get(Host.DefaultId) as Host;
			var contextBase = new HttpContextWrapper(context);

			context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
			context.Response.ContentType = "application/json";

			context.Response.Write("{\"formattedDate\":\"");

			var rawDate = context.Request.QueryString["date"];
			if (!string.IsNullOrEmpty(rawDate))
			{
				DateTime date;
				if (DateTime.TryParse(rawDate, out date))
					context.Response.Write(HttpUtility.JavaScriptStringEncode(host.FormatAgoDate(date)));
			}

			context.Response.Write("\"}");
		}

		#endregion
	}
}