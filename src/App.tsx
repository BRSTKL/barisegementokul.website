import EnergySystemsPortfolio from './components/EnergySystemsPortfolio'
import { ThemeProvider } from "./components/theme-provider"


function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <EnergySystemsPortfolio />
        </ThemeProvider>
    )
}

export default App
