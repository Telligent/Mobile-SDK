using System;
using System.Collections.Generic;

namespace Telligent.Evolution.Mobile.Web.Model
{
	internal class ConfiguredContentFragment
	{
		internal Guid PageId { get; set; }
		internal Guid HostId { get; set; }
		public Guid InstanceId { get; set; }
		public string Configuration { get; set; }
		public bool ShowHeader { get; set; }
		public string CssClassAddition { get; set; }
	}
}