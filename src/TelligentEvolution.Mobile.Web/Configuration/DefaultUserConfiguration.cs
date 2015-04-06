using System.Configuration;

namespace Telligent.Evolution.Mobile.Web.Configuration
{
	public class DefaultUserConfiguration: ConfigurationElement
	{
		[ConfigurationProperty("languageKey", IsRequired=true)]
		public string LanguageKey
		{
			get { return (string) this["languageKey"]; }
			set { this["languageKey"] = value; }
		}

		[ConfigurationProperty("userName", IsRequired = true)]
		public string UserName
		{
			get { return (string)this["userName"]; }
			set { this["userName"] = value; }
		}
	}
}