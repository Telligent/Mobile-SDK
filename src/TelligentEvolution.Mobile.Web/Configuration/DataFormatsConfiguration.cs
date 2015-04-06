using System.Configuration;
using System;

namespace Telligent.Evolution.Mobile.Web.Configuration
{
	public class DataFormatsConfiguration: ConfigurationElement
	{
		[ConfigurationProperty("telephone", IsRequired=false)]
		public TelephoneDataFormatConfiguration Telephone
		{
			get { return (TelephoneDataFormatConfiguration)this["telephone"]; }
			set { this["telephone"] = value; }
		}

	}
}