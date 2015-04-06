using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web.UI;
using Telligent.DynamicConfiguration.Components;

namespace Telligent.Evolution.Mobile.PushNotifications.PropertyControls
{
	public class CertificatePropertyControl : System.Web.UI.Control, IPropertyControl, INamingContainer
	{
		System.Web.UI.HtmlControls.HtmlInputFile _fileUpload;
		System.Web.UI.WebControls.Panel _label;
		System.Web.UI.HtmlControls.HtmlInputHidden _state;

		protected override void CreateChildControls()
		{
			if (_fileUpload == null)
			{
				_fileUpload = new System.Web.UI.HtmlControls.HtmlInputFile();
				_fileUpload.ID = "upload";
			}

			if (_label == null)
				_label = new System.Web.UI.WebControls.Panel();

			if (_state == null)
			{
				_state = new System.Web.UI.HtmlControls.HtmlInputHidden();
				_state.ID = "state";
			}

			Controls.Add(_label);
			Controls.Add(_fileUpload);
			Controls.Add(_state);

			base.CreateChildControls();
		}

		protected override void OnLoad(EventArgs e)
		{
			base.OnLoad(e);

			EnsureChildControls();

			_label.Controls.Clear();
			if (!string.IsNullOrEmpty(_state.Value))
			{
				var certificate = Deserialize(_state.Value);
				if (certificate != null)
					_label.Controls.Add(new LiteralControl(Page.Server.HtmlEncode(certificate.FileName)));
			}
		}

		#region IPropertyControl Members

		public ConfigurationDataBase ConfigurationData { get; set; }
		public Property ConfigurationProperty { get; set; }
		public event ConfigurationPropertyChanged ConfigurationValueChanged;

		public Control Control
		{
			get { return this; }
		}

		public object GetConfigurationPropertyValue()
		{
			EnsureChildControls();
			if (Page.IsPostBack && _fileUpload.PostedFile != null && !string.IsNullOrEmpty(_fileUpload.PostedFile.FileName))
			{
				var certificate = new Certificate { FileName = _fileUpload.PostedFile.FileName };
				using (var stream = _fileUpload.PostedFile.InputStream)
				{
					certificate.Content = new byte[(int)stream.Length];
					stream.Read(certificate.Content, 0, certificate.Content.Length);
				}

				return Serialize(certificate);
			}
			else
				return _state.Value;
		}

		public void SetConfigurationPropertyValue(object value)
		{
			EnsureChildControls();
			if (value != null)
				_state.Value = value.ToString();
			else
				_state.Value = string.Empty;
		}

		#endregion

		internal static string Serialize(Certificate certificate)
		{
			return string.Concat(certificate.FileName, "\n", Convert.ToBase64String(certificate.Content));
		}

		internal static Certificate Deserialize(string value)
		{
			if (string.IsNullOrEmpty(value))
				return null;

			var values = value.Split('\n');
			if (values.Length == 2)
				return new Certificate { FileName = values[0], Content = Convert.FromBase64String(values[1]) };
			else
				return null;
		}
	}

	internal class Certificate
	{
		internal string FileName { get; set; }
		internal byte[] Content { get; set; }
	}
}
