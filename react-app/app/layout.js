import {Header} from './header';
import {inter} from '/app/{utils}/fonts';
import 'bootstrap/dist/css/bootstrap.css'
import "bootstrap-icons/font/bootstrap-icons.css";
import '/style/global.css';
import Script from 'next/script';

export const metadata = {
    // The title of all the pages.
    title: 'CleanEr',
}

/**
 * @brief The main layout of the application.
 */
export default function RootLayout({children}) {
    return (
        <html lang="en">
        <body className={inter.className}>
        <Header/>
        {children}
        </body>
        <Script src="scripts/bootstrap.bundle.min.js"/>
        </html>
    );
}
