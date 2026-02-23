Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead(".\Resume\BarisEgemenTokul_CV_SolarPV_HeatPump (2).docx")
$entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xmlStr = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()

$xml = [xml]$xmlStr
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")
$nodes = $xml.SelectNodes("//w:t", $ns)

$text = ""
foreach ($node in $nodes) { 
    $text += $node.InnerText + "`n" 
}
$text | Out-File -FilePath ".\Resume\extracted_cv.txt" -Encoding utf8
