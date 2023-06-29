import fs from 'fs'

const args = process.argv.slice(2);

const blackList = JSON.parse(fs.readFileSync(args[0], { encoding: 'utf8' }))
const whiteList = JSON.parse(fs.readFileSync(args[1], { encoding: 'utf8' }))
const blackestList = JSON.parse(fs.readFileSync(args[2], { encoding: 'utf8' }))

const baseUrl = 'https://cloud.feedly.com'
const wordSeparatorRegex = /[\s"'‘’“”`\^\~_\.,;\:¡!¿?+\-\/*=\\\(\)\[\]{}|@#$%&<>]+/
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
		console.warn(`

------------------------------------------------------------------
|                           IMPORTANTE                           |
------------------------------------------------------------------
| Debe actualizarse el token de Feedly. Dirijirse a:             |
| https://feedly.com/v3/auth/dev                                 |
|                                                                |
| Una vez que obtenga el token reemplazelo en el archivo .env    |
| o en la variable de entorno: CLIENT_SECRET                     |
------------------------------------------------------------------

`)
		throw 'Invalid Token'
	}

	const responseData = JSON.parse(
		normalizeString(
			await response.text()
		)
	)

	if (response.status !== 200) {
		console.error('Status:', response.status)
		console.error('Response:', responseData)
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
		hasMatchingTokens(title, blackestList) || // Title in blackestList
		( // Title in blackList but not in whiteList
			!hasMatchingTokens(title, whiteList) &&
			hasMatchingTokens(title, blackList)
		)
	)
}

function filterContent(entry) {
	const content = ((entry.content?.content || '') + ' ' + (entry.summary?.content || ''))
		.trim()
		.toLowerCase()

	return (
		content === '' || // No content
		hasMatchingTokens(content, blackestList) || // Content in blackestList
		( // Content in blackList but not in whiteList
			!hasMatchingTokens(content, whiteList) &&
			hasMatchingTokens(content, blackList)
		)
	)
}

function hasMatchingTokens(string, checkTokens) {
	const tokens = string.split(wordSeparatorRegex)

	for (const checkToken of checkTokens) {
		if (wordSeparatorRegex.test(checkToken)) {
			if (string.includes(checkToken)) {
				return true;
			}
		} else {
			if (tokens.includes(checkToken)) {
				return true;
			}
		}
	}

	return false
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

console.log(
	'Entries filtered:',
	entriesToMarkAsRead.map(entry => `${entry.title} - ${entry.canonicalUrl} `)
)
console.log('----------------------------------------------------------------------------------')
console.log(`${entriesToMarkAsRead.length} entries marked as read`)
