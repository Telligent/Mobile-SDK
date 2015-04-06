using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.IO;
using Telligent.Evolution.Mobile.App.Model;
using Telligent.Evolution.Extensibility.Storage.Version1;

namespace Telligent.Evolution.Mobile.App.Services
{
	interface IAppDataService
	{
		AppData Get(ICentralizedFile sourceFile);
		void ExpireCache();
	}
}
