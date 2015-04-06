using System.Configuration;

namespace Telligent.Evolution.Mobile.Web.Configuration
{
	public class OAuthConfiguration : ConfigurationElement
	{
		[ConfigurationProperty("clientId", IsRequired=true)]
		public string ClientId
		{
			get { return (string) this["clientId"]; }
			set { this["clientId"] = value; }
		}

		[ConfigurationProperty("clientSecret", IsRequired=true)]
		public string ClientSecret
		{
			get { return (string) this["clientSecret"]; }
			set { this["clientSecret"] = value; }
		}
	}
}