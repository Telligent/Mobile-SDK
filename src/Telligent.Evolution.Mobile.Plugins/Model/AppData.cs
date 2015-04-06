using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Telligent.Evolution.Extensibility.Storage.Version1;

namespace Telligent.Evolution.Mobile.App.Model
{
	internal class AppData
	{
		public ICentralizedFile Image { get; set; }
		public ICentralizedFile File { get; set; }
		public AppType AppType { get; set; }		
		public string Name { get; set; }
		public string ApplicationId { get; set; }
		public bool IsDirectlyInstallable { get; set; }
	}
}
