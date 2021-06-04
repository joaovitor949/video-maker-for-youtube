  const algorithmia = require('algorithmia')
  const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
  const setenceBoundaryDetection = require('sbd')

  const watsonApiKey = require('../credentials/watson-nlu.json').apikey

  const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-classifier/v1.js')

  var nlu = new NaturalLanguageUnderstandingV1({
    iam_apikey: watsonApiKey,
    version: '2018-04-05',
    url: 'https://gateway.watsonplatform.net/natural-language-classifier/api/'
  })

  async function robot(content) {
      console.log('> [text-robot] Starting...')
      //const content = state.load()


    await fetchContentFromWikipedia(content)
      sanitizeContent(content)
    breakContentIntoSetences(content)
      limitMaximumSentences(content)
    await fetchKeywords0fAllSentences(content)

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

          const sentences = setenceBoundaryDetection.sentences(content.sourceContentSanitized)
          sentences.forEach((sentence) => {
              content.sentences.push({
              text: sentence,
              keywords: [],
              images: []
              })
          })
        }

        function limitMaximumSentences(content) {
          content.sentences = content.sentences.slice(0, content.maximumSentences)
        }

        async function fetchKeywords0fAllSentences(content) {
          for (const sentence of content.sentences){
            sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
          }
        }

          async function fetchWatsonAndReturnKeywords(sentence) {
            return new Promise((resolve, reject) => {
              nlu.analyze({
                text: sentence,
                features: {
                  keywords: {}
                }
              }, (error, response) => {
                if (error) {
                  reject(error)
                  return
                }
        
                const keywords = response.keywords.map((keyword) => {
                  return keyword.text
                })
        
                resolve(keywords)
              })
            })
          }
          console.log(JSON.stringify(content, null, 4))       
  }
  module.exports = robot