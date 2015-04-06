using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;
using Telligent.Evolution.Mobile.Web.Model;

namespace Telligent.Evolution.Mobile.Web.Services
{
	internal interface IConfiguredContentFragmentService
	{
		string GetHostIdentifier(ConfiguredContentFragment fragment);
		ConfiguredContentFragment GetByHostIdentifier(string hostIdentifier);
	}
}
