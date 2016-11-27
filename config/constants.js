const extend = require('extend');
const override = require('./config.json');

let config = {
  newegg: {
    canada: {

    },
    usa: {
      gamingLaptop: {
        url: 'http://www.newegg.com/Gaming-Laptops/SubCategory/ID-3365?PageSize=96',
        paginatedUrl: 'http://www.newegg.com/Gaming-Laptops/SubCategory/ID-3365/page-%d?PageSize=96&order=BESTMATCH',
        savedFilePath: 'neweggUSAGamingLaptopUris.txt'
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
        savedFilePath: 'amazonUSAGamingLaptopUris.txt'
      }
    }
  },
  superbiiz: {
    gamingLaptop: {
      paginatedUrl: 'http://www.superbiiz.com/query.php?s=%20&categry=57&stock=all&dp=%d&nl=50&stock=all',
      savedFilePath: 'superbiizGamingLaptopUris.txt'
    }
  },
  bestbuy: {
    gamingLaptop: {
      paginatedUrl: 'http://www.bestbuy.com/site/searchpage.jsp?cp=%d&ks=960&list=y&id=pcat17071&browsedCategory=pcmcat287600050003&st=pcmcat287600050003_categoryid%24abcat0502000&qp=collection_facet%3DSAAS~Collection~Gaming%20Series%5Ecomputergraphicstypesv_facet%3DGraphics%20Type~Discrete',
      savedFilePath: 'bestbuyGamingLaptopUris.txt'
    }
  },
  bandh: {
    gamingLaptop: {
      paginatedUrl: 'https://www.bhphotovideo.com/c/buy/gaming-notebooks/ipp/100/ci/24610/pn/%d/N/3670569600/view/GALLERY',
      savedFilePath: 'bandhGamingLaptopUris.txt'
    }
  },
  nightmare: {
    numWorkers: 3,
    settings: {
      executionTimeout: 2000,
      show: false,
      waitTimeout: 20000
    },
    useragent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.87 Safari/537.36'
  }
};

module.exports = extend(true, {}, config, override);
