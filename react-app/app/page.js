import {UserInput} from './user_input';

/**
 * @brief This is the first page of the application. It receives user input.
 */
export default function Page() {
    return (
        <>
            <main className="w-75">
                <UserInput/>
            </main>
        </>
    );
}
