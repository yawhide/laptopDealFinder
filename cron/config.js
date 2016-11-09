module.exports = {
  newegg: {
    canada: {

    },
    usa: {
      gamingLaptop: {
        url: 'http://www.newegg.com/Gaming-Laptops/SubCategory/ID-3365?PageSize=96',
        paginatedUrl: 'http://www.newegg.com/Gaming-Laptops/SubCategory/ID-3365/page-%d?PageSize=96&order=BESTMATCH',
        savedFilePath: 'neweggUSAGamingLaptopUris.txt',
      }
    }
  },
  amazon: {
    canada: {

    },
    usa: {
      gamingLaptop: {
        url: 'https://www.amazon.com/s/ref=lp_13896615011_nr_p_n_intended_use_bro_0?fst=as%3Aoff&rh=n%3A172282%2Cn%3A%21493964%2Cn%3A541966%2Cn%3A13896617011%2Cn%3A565108%2Cn%3A13896615011%2Cp_n_intended_use_browse-bin%3A9647497011&bbn=13896615011&ie=UTF8&qid=1471569475&rnid=9647496011',
        paginatedUrl: 'https://www.amazon.com/s/?fst=as%3Aoff&rh=n%3A172282%2Cn%3A%21493964%2Cn%3A541966%2Cn%3A13896617011%2Cn%3A565108%2Cn%3A13896615011%2Cp_n_intended_use_browse-bin%3A9647497011&bbn=13896615011&ie=UTF8&qid=1471569475&rnid=9647496011&page=%d',
        savedFilePath: 'amazonUSAGamingLaptopUris.txt',
      }
    }
  },
  nightmare: {
    settings: {
      executionTimeout: 2000,
      show: false,
      waitTimeout: 20000,
    },
    useragent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.87 Safari/537.36',
  }
}
