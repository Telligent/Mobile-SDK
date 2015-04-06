using System;
using System.Collections.Generic;
using System.Web.Routing;

namespace Telligent.Evolution.Mobile.Web.Model
{
	internal class EntityUrlRequirement
	{
		public string EntityType { get; set; }
		public string Relationship { get; set; }
		public string IdEquals { get; set; }
		public Guid? ApplicationTypeIdEquals { get; set; }
		public Guid? ContainerTypeIdEquals { get; set; }
	}
}