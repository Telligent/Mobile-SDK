using System;
using Telligent.Evolution.Extensibility.UI.Version1;
using Telligent.Evolution.Mobile.Web.Services;

namespace Telligent.Evolution.Mobile.Web.Extensions
{
	public class RemoteAuthenticationExtension : IScriptedContentFragmentExtension
	{
		public object Extension
		{
			get { return new RemoteAuthenticationExtensionApi(); }
		}

		public string ExtensionName
		{
			get { return "mobile_v1_authentication"; }
		}
	}

	public class RemoteAuthenticationExtensionApi
	{
		public string Login()
		{
			return "#login";
		}

		public string Logout()
		{
			return "#logout";
		}
	}
}