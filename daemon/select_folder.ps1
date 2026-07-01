Add-Type -AssemblyName System.Windows.Forms

# Create a hidden TopMost owner form so the dialog appears in front of everything
$owner = New-Object System.Windows.Forms.Form
$owner.TopMost = $true
$owner.StartPosition = "CenterScreen"
$owner.WindowState = "Minimized"
$owner.ShowInTaskbar = $false

$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = "Select Project Folder"
$dialog.RootFolder = "MyComputer"
$dialog.ShowNewFolderButton = $false

$result = $dialog.ShowDialog($owner)
$owner.Dispose()

if ($result -eq "OK") {
    Write-Output $dialog.SelectedPath
} else {
    Write-Output "CANCEL"
}
