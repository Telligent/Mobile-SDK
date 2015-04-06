using System.Configuration;

namespace Telligent.Evolution.Mobile.Web.Configuration
{
	public class MobileConfigurationSection : ConfigurationSection
	{
		[ConfigurationProperty("evolutionUrl", IsRequired=true)]
		public string EvolutionUrl
		{
			get { return (string) this["evolutionUrl"]; }
			set { this["evolutionUrl"] = value; }
		}

		[ConfigurationProperty("networkUserName", IsRequired = true)]
		public string NetworkUserName
		{
			get { return (string)this["networkUserName"]; }
			set { this["networkUserName"] = value; }
		}

		[ConfigurationProperty("networkPassword", IsRequired = true)]
		public string NetworkPassword
		{
			get { return (string)this["networkPassword"]; }
			set { this["networkPassword"] = value; }
		}

		[ConfigurationProperty("networkDomain", IsRequired = true)]
		public string NetworkDomain
		{
			get { return (string)this["networkDomain"]; }
			set { this["networkDomain"] = value; }
		}

		[ConfigurationProperty("urlScheme", IsRequired = true)]
		public string UrlScheme
		{
			get { return (string)this["urlScheme"]; }
			set { this["urlScheme"] = value; }
		}

		[ConfigurationProperty("oAuth", IsRequired=true)]
		public OAuthConfiguration OAuth
		{
			get { return (OAuthConfiguration) this["oAuth"]; }
			set { this["oAuth"] = value; }
		}

		[ConfigurationProperty("defaultUser", IsRequired=true)]
		public DefaultUserConfiguration DefaultUser
		{
			get { return (DefaultUserConfiguration)this["defaultUser"]; }
			set { this["defaultUser"] = value; }
		}

		[ConfigurationProperty("authorization", IsRequired = true)]
		public AuthorizationConfiguration Authorization
		{
			get { return (AuthorizationConfiguration)this["authorization"]; }
			set { this["authorization"] = value; }
		}

		[ConfigurationProperty("dataFormats", IsRequired = false)]
		public DataFormatsConfiguration DataFormats
		{
			get { return (DataFormatsConfiguration)this["dataFormats"]; }
			set { this["dataFormats"] = value; }
		}
	}
}