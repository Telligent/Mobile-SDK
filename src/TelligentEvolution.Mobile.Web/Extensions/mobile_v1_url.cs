using System;
using System.Linq;
using Telligent.Evolution.Extensibility.UI.Version1;
using Telligent.Evolution.Mobile.Web.Services;
using Telligent.Evolution.Mobile.Web.Implementations;
using Telligent.Evolution.Mobile.Web.Services;
using System.Collections;

namespace Telligent.Evolution.Mobile.Web.Extensions
{
	public class MobileUrlExtension : IScriptedContentFragmentExtension
	{
		public object Extension
		{
			get { return new MobileUrlExtensionApi(); }
		}

		public string ExtensionName
		{
			get { return "mobile_v1_url"; }
		}
	}

	public class MobileUrlExtensionApi
	{
		IPageService _pageService = Telligent.Evolution.Mobile.Web.ServiceLocator.Get<IPageService>();
		IMobileRedirectionService _redirectionService = Telligent.Evolution.Mobile.Web.ServiceLocator.Get<IMobileRedirectionService>();
	
		public string Current
		{
			get
			{
				var handler = System.Web.HttpContext.Current.Handler as PageHttpHandler;
				if (handler != null && handler.Page != null)
					return handler.Page.Name;
				else
					return null;
			}
		}

		public string Format(string urlName, params object[] args)
		{
			var page = _pageService.GetAll().FirstOrDefault(x => string.Compare(x.Name, urlName, StringComparison.Ordinal) == 0);
			if (page == null)
				return string.Empty;
			else
				return string.Format(page.FormatString, args);
		}

		public bool IsRedirected(string url)
		{
			return !string.IsNullOrEmpty(Redirect(url));
		}

		public string Redirect(string url)
		{
			return Redirect(url, null);
		}

		public string Redirect(string url, IDictionary options)
		{
			if (string.IsNullOrEmpty(url))
				return null;

			Host host = Host.Get(Host.DefaultId) as Host;

			if (!url.StartsWith("~/"))
			{
				var index = url.IndexOf("~/");
				if (index < 0)
					return null;

				url = url.Substring(index);
			}

			string target = "local";
			if (options != null && options["Target"] != null)
				target = options["Target"].ToString();

			if (string.Compare(target, "host", true) == 0)
				return host.GetDirectEvolutionRedirectUrl(url);
			else
			{
				string redirectUrl;
				if (_redirectionService.TryGetRedirectUrl(host, url, out redirectUrl))
					return host.AbsoluteUrl(redirectUrl);

				return null;
			}
		}
	}
}