const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const setenceBoundaryDetection = require('sbd')

 async function robot(content) {
     console.log('> [text-robot] Starting...')
     //const content = state.load()


  await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSetence(content)
    //limitMaximumSetences(content)
   //await fetchKeywords0fAllSetences(content)

    //state.save(content)

     async function fetchContentFromWikipedia(content) {
         console.log('> [text-robot] Fetching content from Wikipedia')
         const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
         const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2')
         const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm)
         const wikipediaContent = wikipediaResponse.get()
    
        content.sourceContentOriginal = wikipediaContent.content
        console.log('> [text-robot] Fetching done!')
    }

    function sanitizeContent(content) {
        const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
        const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown)
    
        console.log(withoutBlankLinesAndMarkdown)

        content.sourceContentSanitized = withoutDatesInParentheses
    
        function removeBlankLinesAndMarkdown(text) {
          const allLines = text.split('\n')
    
          const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
            if (line.trim().length === 0 || line.trim().startsWith('=')) {
              return false
            }
    
            return true
          })
    
          return withoutBlankLinesAndMarkdown.join(' ')
        }
    }
    
    function removeDatesInParentheses(text) {
        return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
    }

    function breakContentIntoSetences(content) {
        content.sentences = []

        const setences = setenceBoundaryDetection.sentences(content.sourceContentSanitized)
        setences.forEach((stence) => {
            content.setences.push({
                text: setenceBoundaryDetection,
                keywords: [],
                images: []
            })
        })
    }
}

module.exports = robot