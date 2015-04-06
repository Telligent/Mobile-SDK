using System.Configuration;
using System;

namespace Telligent.Evolution.Mobile.Web.Configuration
{
	public class AuthorizationConfiguration: ConfigurationElement
	{
		[ConfigurationProperty("cookieName", IsRequired=true)]
		public string CookieName
		{
			get { return (string)this["cookieName"]; }
			set { this["cookieName"] = value; }
		}

		[ConfigurationProperty("allowAnonymous", IsRequired = false, DefaultValue = "false")]
		public bool AllowAnonymous
		{
			get
			{
				bool parsedAllowAnonymous;
				var allowAnonymous = this["allowAnonymous"].ToString() ?? String.Empty;
				if (bool.TryParse(allowAnonymous, out parsedAllowAnonymous))
					return parsedAllowAnonymous;
				else
					return false;
			}
			set { this["allowAnonymous"] = value.ToString(); }
		}

		[ConfigurationProperty("loginPage", IsRequired = false, DefaultValue = "login")]
		public string LoginPage
		{
			get { return (string)this["loginPage"]; }
			set { this["loginPage"] = value; }
		}
	}
}