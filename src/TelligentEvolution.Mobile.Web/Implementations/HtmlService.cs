using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Telligent.Evolution.Mobile.Web;
using Telligent.Evolution.Mobile.Web.Services;
using System.Web.UI;
using System.Web;

[assembly: WebResource("Telligent.Evolution.Mobile.Web.Scripts.telligent.evolution.mobile.js", "application/javascript")]
namespace Telligent.Evolution.Mobile.Web.Implementations
{
	internal class HtmlService : IHtmlService
	{
		Page _page = null;
		private readonly IMobileConfiguration _config;

		public HtmlService(IMobileConfiguration mobileConfiguration)
		{
			_config = mobileConfiguration;
		}

		#region IHeaderService Members

		public string GetHeaders(HttpContextBase httpContext)
		{
			if (_page == null)
				_page = new Page();

			var host = Host.Get(Host.DefaultId);

			StringBuilder headers = new StringBuilder();
            headers.Append(@"<script>_evolutionForceTouchRemap = true; window.parent = {};</script>");
			headers.Append(host.GetHeaders(false));
			headers.AppendFormat("<script src=\"{0}\"></script>",
				HttpUtility.HtmlAttributeEncode(new Uri(host.AbsoluteUrl(_page.ClientScript.GetWebResourceUrl(this.GetType(), "Telligent.Evolution.Mobile.Web.Scripts.telligent.evolution.mobile.js"))).OriginalString));
			headers.Append(@"<script>
$.telligent.evolution.mobile.defaults.allowAnonymous = ").Append(_config.AllowAnonymous ? "true" : "false").Append(@";
$.telligent.evolution.mobile.defaults.telephonePattern = """).Append(HttpUtility.JavaScriptStringEncode(_config.TelephonePattern)).Append(@""";
$.telligent.evolution.mobile.defaults.isHttpAuth = ").Append(string.IsNullOrEmpty(_config.EvolutionNetworkUserName) ? "false" : "true").Append(@";
</script>");
			headers.AppendFormat("<script src=\"{0}\"></script>",
				HttpUtility.HtmlAttributeEncode(host.AbsoluteUrl("~/javascripts")));
			headers.AppendFormat("<link rel=\"stylesheet\" type=\"text/css\" media=\"screen\" href=\"{0}\" />",
				HttpUtility.HtmlAttributeEncode(host.AbsoluteUrl("~/stylesheets")));
			return headers.ToString();
		}

		public string GetRootBody(HttpContextBase httpContext)
		{
			return @"
<div id=""viewport"" class="""">
	<div id=""debug"" class=""fixed""></div>
	<div id=""gutter-wrapper"">
		<div id=""gutter"" style=""width: 100%;"">
			<div id=""gutter-content-wrapper"">
				<div id=""gutter-content""></div>
			</div>
		</div>
	</div>
	<div id=""content-wrapper"">
		<div id=""header"" class=""fixed""></div>
		<div id=""content"">
			<div id=""refresh-indicator""></div>
			<div id=""refreshable-content"">
				<div class=""slideable""></div>
			</div>
		</div>
	</div>
</div>";
		}

		#endregion
	}
}
