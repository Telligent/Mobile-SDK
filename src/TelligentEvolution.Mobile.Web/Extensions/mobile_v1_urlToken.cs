using System;
using Telligent.Evolution.Extensibility.UI.Version1;
using Telligent.Evolution.Mobile.Web.Services;

namespace Telligent.Evolution.Mobile.Web.Extensions
{
	public class UrlTokenExtension : IScriptedContentFragmentExtension
	{
		public object Extension
		{
			get { return new UrlTokenExtensionApi(); }
		}

		public string ExtensionName
		{
			get { return "mobile_v1_urlToken"; }
		}
	}

	public class UrlTokenExtensionApi
	{
		public string Value(string tokenName)
		{
			var host = Host.Get(Host.DefaultId) as Host;
			if (host != null && !string.IsNullOrEmpty(tokenName))
				return host.GetUrlTokenValue(tokenName);

			return null;
		}

		public string[] TokenNames
		{
			get
			{
				var host = Host.Get(Host.DefaultId) as Host;
				if (host != null)
					return host.GetUrlTokenNames();

				return new string[0];
			}
		}
	}
}