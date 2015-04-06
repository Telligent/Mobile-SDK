using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;

namespace Telligent.Evolution.Mobile.Web.Services
{
	internal interface IHtmlService
	{
		string GetHeaders(HttpContextBase httpContext);
		string GetRootBody(HttpContextBase httpContext);
	}
}
