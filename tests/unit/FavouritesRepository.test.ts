import {
  favouritesRepository,
  useFavouritesStore,
} from '../../src/features/favourites/data/FavouritesRepository';

describe('favouritesRepository', () => {
  beforeEach(() => {
    useFavouritesStore.setState({ favourites: [] });
  });

  it('starts empty', async () => {
    expect(await favouritesRepository.getAll()).toEqual([]);
  });

  it('toggle adds a pair not yet favourited', async () => {
    await favouritesRepository.toggle('BTCUSDT');
    expect(await favouritesRepository.getAll()).toEqual(['BTCUSDT']);
  });

  it('toggle removes a pair that is already favourited', async () => {
    await favouritesRepository.toggle('BTCUSDT');
    await favouritesRepository.toggle('BTCUSDT');
    expect(await favouritesRepository.getAll()).toEqual([]);
  });

  it('tracks multiple pairs independently', async () => {
    await favouritesRepository.toggle('BTCUSDT');
    await favouritesRepository.toggle('ETHUSDT');
    await favouritesRepository.toggle('BTCUSDT');

    expect(await favouritesRepository.getAll()).toEqual(['ETHUSDT']);
  });
});
