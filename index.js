import whiteList from './data/whiteList.json' assert {type: 'json'}
import blackList from './data/blackList.json' assert {type: 'json'}
import blackestList from './data/blackestList.json' assert {type: 'json'}

const baseUrl = 'https://cloud.feedly.com'
const wordSeparatorRegex = /[\s.",;:¡!¿?\-]+/g
const processedTitles = []

let continuation = null
let unreadEntries = []
while (true) {
	const streamsParams = (new URLSearchParams({
		streamId: process.env.COLLECTION,
		count: 250,
		ranked: 'oldest',
		continuation: continuation,
		unreadOnly: true
	})).toString()

	const response = await fetch(
		`${baseUrl}/v3/streams/contents?${streamsParams}`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${process.env.CLIENT_SECRET}`
			}
		}
	)

	if (response.status === 401) {
		console.log(`

------------------------------------------------------------------
|                           IMPORTANTE                           |
------------------------------------------------------------------
| Debe actualizarse el toke de Feedly. Dirijase a:               |
| https://feedly.com/v3/auth/dev                                 |
|                                                                |
| Una vez que obtenga el token reemplazelo en el archivo .env    |
| o en la variable de entorno: CLIENT_SECRET                       |
------------------------------------------------------------------

`)
		break
	}

	const responseData = JSON.parse(
		normalizeString(
			await response.text()
		)
	)

	if (response.status !== 200) {
		console.log('Status:', response.status)
		console.log('Response:', responseData)
		break;
	}

	unreadEntries = unreadEntries.concat(responseData.items)

	if (typeof responseData.continuation === 'undefined') {
		break
	}
	continuation = responseData.continuation

}

function normalizeString(string) {
	return string.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

const entriesToMarkAsRead = unreadEntries.filter(filterEntry)

function filterEntry(entry) {
	return (
		filterDuplicate(entry) ||
		filterTitle(entry) ||
		filterContent(entry)
	)
}

function filterDuplicate(entry) {
	const isDuplicate = processedTitles.includes(entry.title)

	processedTitles.push(entry.title)

	return isDuplicate
}

function filterTitle(entry) {
	const title = entry.title.toLowerCase().trim()
	return (
		filterStringTokens(title, blackestList).length > 0 || // Title in blackestList
		( // Title in blackList but not in whiteList
			filterStringTokens(title, blackList).length > 0 &&
			filterStringTokens(title, whiteList).length === 0
		)
	)
}

function filterContent(entry) {
	const content = ((entry.content?.content || '') + ' ' + (entry.summary?.content || ''))
		.trim()
		.toLowerCase()

	return (
		content === '' || // No content
		filterStringTokens(content, blackestList).length > 0 || // Content in blackestList
		( // Content in blackList but not in whiteList
			filterStringTokens(content, blackList).length > 0 &&
			filterStringTokens(content, whiteList).length === 0
		)
	)
}

function filterStringTokens(string, checkTokens) {
	const tokens = string.split(wordSeparatorRegex)

	return checkTokens.filter(
		checkToken => (
			wordSeparatorRegex.test(checkToken)
			? string.includes(checkToken)
			: tokens.includes(checkToken)
		)
	)
}

await fetch(
	`${baseUrl}/v3/markers`,
	{
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${process.env.CLIENT_SECRET}`
		},
		body: JSON.stringify({
			action: 'markAsRead',
			type: 'entries',
			entryIds: entriesToMarkAsRead.map(entry => entry.id)
		})
	}
)

console.log(entriesToMarkAsRead.map(entry => `${entry.title} - ${entry.canonicalUrl} `))
console.log('----------------------------------------------------------------------------------')
console.log(`${entriesToMarkAsRead.length} entries marked as read`)
