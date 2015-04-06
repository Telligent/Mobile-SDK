using System;
using System.Collections.Generic;
using System.Web.Routing;

namespace Telligent.Evolution.Mobile.Web.Model
{
	internal class EntityUrl
	{
		public string Url { get; set; }
		public EntityUrlToken[] Tokens { get; set; }
		public EntityUrlRequirement[] Requirements { get; set; }
	}
}