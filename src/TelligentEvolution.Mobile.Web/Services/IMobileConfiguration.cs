using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Telligent.Evolution.Extensibility.UI.Version1;
using Telligent.Evolution.Mobile.Web.Model;

namespace Telligent.Evolution.Mobile.Web.Services
{
	internal interface IMobileConfiguration
	{
		string EvolutionUrl { get; }
		string EvolutionNetworkUserName { get; }
		string EvolutionNetworkPassword { get; }
		string EvolutionNetworkDomain { get; }
		string UrlScheme { get; }
		string OAuthClientId { get; }
		string OAuthClientSecret { get; }
		string DefaultUserLanguageKey { get; }
		string DefaultUserName { get; }
		string AuthorizationCookieName { get; }
		bool AllowAnonymous { get; }
		string LoginPage { get; }

		IScriptedContentFragmentExtension[] Extensions { get; }
		EntityUrl[] EntityUrls { get; }
		string[] JavaScripts { get; }
		string[] StyleSheets { get; }
		EmbeddedFile[] EmbeddedFiles { get; }

		DateTime LastModifiedDateUtc { get; }

		string TelephonePattern { get; }
	}
}
