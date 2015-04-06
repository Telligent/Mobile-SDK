using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;

namespace EmbeddedFileBuild
{
    /// <summary>
    /// Oh man, so many utilities, in tidy little completely non-extensible static methods.
    /// </summary>
    public static class Utility
    {
        public static bool IsPathDirectory(string path)
        {
            FileAttributes attr = File.GetAttributes(path);
            return (attr & FileAttributes.Directory) == FileAttributes.Directory;
        }

        public static bool PathExists(string path)
        {
            return Directory.Exists(path) || File.Exists(path);
        }
    }
}
