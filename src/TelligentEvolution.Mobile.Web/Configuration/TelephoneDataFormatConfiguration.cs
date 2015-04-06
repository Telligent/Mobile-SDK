using System.Configuration;
using System;

namespace Telligent.Evolution.Mobile.Web.Configuration
{
	public class TelephoneDataFormatConfiguration: ConfigurationElement
	{
		[ConfigurationProperty("pattern", IsRequired=false)]
		public string Pattern
		{
			get { return (string)this["pattern"]; }
			set { this["pattern"] = value; }
		}

	}
}